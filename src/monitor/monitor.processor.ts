import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Job } from "bullmq";
import { PrismaService } from '../prisma/prisma.service.js';
import { MonitorCheckerService } from './monitor-checker.service.js';
import { MonitorCheckService } from './monitor-check.service.js';
import { MonitorStatus, OrganizationRole } from "../generated/prisma/enums.js";
import { MonitorQueueService } from './monitor-queue.service.js';
import { NotificationsService } from '../notifications/notifications.service.js';
import {MonitorLockService} from './monitor-lock.service.js';

@Processor("monitor-checks")
export class MonitorProcessor extends WorkerHost {
  constructor(
    private readonly prisma: PrismaService,
    private readonly monitorCheckerService: MonitorCheckerService,
    private readonly monitorCheckService: MonitorCheckService,
    private readonly monitorQueueService: MonitorQueueService,
    private readonly notificationsService: NotificationsService,
    private readonly monitorLockService: MonitorLockService,
  ) {
    super();
  }

  async process(job: Job<{ monitorId: string }>): Promise<void> {
    console.log("PROCESSOR STARTED:", job.id, job.name);

    // 1. Make sure this is the expected job.
    if (job.name !== "check-monitor") {
      console.log("Unexpected job name:", job.name);
      return;
    }

    const { monitorId } = job.data;

    // 2. Find the monitor.
    const initialMonitor = await this.prisma.monitor.findUnique({
      where: { id: monitorId },
    });

    if (!initialMonitor) {
      console.log("Monitor not found!");
      return;
    }

    if (initialMonitor.status !== MonitorStatus.ACTIVE) {
      console.log("Monitor is paused; skipping check.");
      return;
    }

    // 3. Calculate how long the Redis lock should remain valid.
    const lockTtlMs = Math.max(
      (initialMonitor.timeoutSeconds + 30) * 1000,
      60000,
    );

    // 4. Try to acquire the lock for this monitor.
    const lockToken = await this.monitorLockService.acquire(
      monitorId,
      lockTtlMs,
    );

    if (!lockToken) {
      console.log("Another check is running for this monitor. Skipping.");
      return;
    }

    let shouldNotify = false;
    let monitorForNotification: typeof initialMonitor | null = null;

    try {
      // 5. Fetch the monitor again after acquiring the lock.
      const monitor = await this.prisma.monitor.findUnique({
        where: { id: monitorId },
      });

      if (!monitor || monitor.status !== MonitorStatus.ACTIVE) {
        console.log("Monitor is no longer active. Skipping.");
        return;
      }

      // 6. Perform the HTTP check.
      console.log("Starting HTTP check...");

      const result = await this.monitorCheckerService.check(monitor);

      console.log("Check result:", result);

      // 7. Save the result in the database.
      await this.monitorCheckService.createCheck(monitor.id, result);

      console.log("MonitorCheck saved successfully!");

      // 8. Update the failure counter and potentially pause the monitor.
      shouldNotify = await this.prisma.$transaction(async (tx) => {
        // Successful check: reset the consecutive failure counter.
        if (result.status === "SUCCESS") {
          await tx.monitor.updateMany({
            where: {
              id: monitorId,
              status: MonitorStatus.ACTIVE,
            },
            data: {
              consecutiveFailures: 0,
            },
          });

          return false;
        }

        // Failed check: increment the counter atomically.
        const incrementResult = await tx.monitor.updateMany({
          where: {
            id: monitorId,
            status: MonitorStatus.ACTIVE,
          },
          data: {
            consecutiveFailures: {
              increment: 1,
            },
          },
        });

        // Monitor may already have been paused.
        if (incrementResult.count === 0) {
          return false;
        }

        // Check whether the failure threshold has been reached.
        const pauseResult = await tx.monitor.updateMany({
          where: {
            id: monitorId,
            status: MonitorStatus.ACTIVE,
            consecutiveFailures: {
              gte: 6,
            },
          },
          data: {
            status: MonitorStatus.PAUSED,
          },
        });

        // Only the job that successfully paused the monitor
        // should send the notification.
        return pauseResult.count === 1;
      });

      if (shouldNotify) {
        monitorForNotification = monitor;
      }
    } finally {
      // 9. Always attempt to release the Redis lock.
      try {
        await this.monitorLockService.release(monitorId, lockToken);
        console.log("Monitor lock released.");
      } catch (error) {
        console.error("Failed to release monitor lock:", error);
        // The Redis TTL will eventually expire the lock.
      }
    }

    // 10. Notify organization administrators after releasing the lock.
    if (shouldNotify && monitorForNotification) {
      console.log("FAILURE THRESHOLD REACHED!");

      try {
        await this.monitorQueueService.removeMonitorCheck(monitorId);
        console.log("Recurring scheduler removed.");
      } catch (error) {
        console.error("Failed to remove recurring scheduler:", error);
      }

      const recipients = await this.prisma.organizationMember.findMany({
        where: {
          organizationId: monitorForNotification.organizationId,
          role: {
            in: [OrganizationRole.OWNER, OrganizationRole.ADMIN],
          },
        },
        select: {
          user: {
            select: {
              email: true,
            },
          },
        },
      });

      console.log("Recipients found:", recipients.length);

      const results = await Promise.allSettled(
        recipients.map((recipient) =>
          this.notificationsService.sendEmail(
            recipient.user.email,
            "Monitor Automatically Paused",
            `Your monitor "${monitorForNotification.name}" has been automatically paused after 6 consecutive failures.

URL: ${monitorForNotification.url}

Please investigate the issue and resume the monitor when appropriate.`,
          ),
        ),
      );

      results.forEach((result, index) => {
        if (result.status === "rejected") {
          console.error(
            `Failed to notify ${recipients[index].user.email}:`,
            result.reason,
          );
        } else {
          console.log(`Notification sent to ${recipients[index].user.email}`);
        }
      });

      console.log("Notification process completed.");
    }

    console.log("PROCESSOR COMPLETED:", job.id);
  }
}
