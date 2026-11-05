import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Job } from "bullmq";
import { PrismaService } from '../prisma/prisma.service.js';
import { MonitorCheckerService } from './monitor-checker.service.js';
import { MonitorCheckService } from './monitor-check.service.js';
import { MonitorStatus, OrganizationRole } from "../generated/prisma/enums.js";
import { MonitorQueueService } from './monitor-queue.service.js';
import { NotificationsService } from '../notifications/notifications.service.js';

@Processor("monitor-checks")
export class MonitorProcessor extends WorkerHost {
  constructor(
    private readonly prisma: PrismaService,
    private readonly monitorCheckerService: MonitorCheckerService,
    private readonly monitorCheckService: MonitorCheckService,
    private readonly monitorQueueService : MonitorQueueService,
    private readonly notificationsService : NotificationsService,
  ) {
    super();
  }
  async process(job: Job<{ monitorId: string }>): Promise<void> {
    console.log("PROCESSOR STARTED:", job.id, job.name);

    if (job.name !== "check-monitor") {
      console.log("Unexpected job name:", job.name);
      return;
    }

    const { monitorId } = job.data;
    console.log("Looking for monitor:", monitorId);

    const monitor = await this.prisma.monitor.findUnique({
      where: { id: monitorId },
    });

    if (!monitor) {
      console.log("Monitor not found!");
      return;
    }

    console.log("Monitor status:", monitor.status);

    if (monitor.status !== MonitorStatus.ACTIVE) {
      console.log("Monitor is paused; skipping check.");
      return;
    }

    console.log("Starting HTTP check...");

    const result = await this.monitorCheckerService.check(monitor);
    console.log("Check result:", result);

    await this.monitorCheckService.createCheck(monitor.id, result);


    await this.monitorCheckService.createCheck(monitor.id, result);
    console.log("MonitorCheck saved successfully!");

    // Update the failure counter and decide whether to pause.
    const shouldNotify = await this.prisma.$transaction(async (tx) => {
      // 1. Successful check: reset the counter.
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

      // 2. Failed check: increment the counter atomically.
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

      if (incrementResult.count === 0) {
        return false;
      }

      // 3. Check whether the threshold has been reached.
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

      return pauseResult.count === 1;
    });

    // 4. Only the job that successfully paused the monitor gets here.
    if (shouldNotify) {
      console.log("FAILURE THRESHOLD REACHED!");

      await this.monitorQueueService.removeMonitorCheck(monitorId);
      console.log("Recurring scheduler removed.");

      const recipients = await this.prisma.organizationMember.findMany({
        where: {
          organizationId: monitor.organizationId,
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
            `Your monitor "${monitor.name}" has been automatically paused after 6 consecutive failures.

URL: ${monitor.url}

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
        }
      });

      console.log("Notification process completed.");
    }



    console.log("MonitorCheck saved successfully!");
  }


}
