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
}