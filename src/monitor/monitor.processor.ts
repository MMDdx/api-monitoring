import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Job } from "bullmq";
import { PrismaService } from '../prisma/prisma.service.js';
import { MonitorCheckerService } from './monitor-checker.service.js';
import { MonitorCheckService } from './monitor-check.service.js';
import { MonitorStatus } from '../generated/prisma/enums.js';

@Processor("monitor-checks")
export class MonitorProcessor extends WorkerHost {
  constructor(
    private readonly prisma: PrismaService,
    private readonly monitorCheckerService: MonitorCheckerService,
    private readonly monitorCheckService: MonitorCheckService,
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

    console.log("MonitorCheck saved successfully!");
  }
}
