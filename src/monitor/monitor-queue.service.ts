import { Injectable } from "@nestjs/common";
import { InjectQueue } from "@nestjs/bullmq";
import {Queue} from "bullmq"

@Injectable()
export class MonitorQueueService {
  constructor(
    @InjectQueue("monitor-checks") private readonly monitorQueue: Queue,
  ) {}

  async addMonitorCheck(monitorId: string) {
    return this.monitorQueue.add("check-monitor", {
      monitorId,
    });
  }

  async monitorScheduleCheck(monitorId: string, intervalSeconds: number) {

    return this.monitorQueue.upsertJobScheduler(
      `monitor-${monitorId}`,
      {
        every: intervalSeconds * 1000,
      },
      {
        name: "check-monitor",
        data: { monitorId },
        opts: {
          attempts: 3,
          backoff: {
            type: "exponential",
            delay: 1000,
          },
        },
      },
    );
  }

  async removeMonitorCheck(monitorId: string) {
    return this.monitorQueue.remove(`monitor-${monitorId}`);
  }

}