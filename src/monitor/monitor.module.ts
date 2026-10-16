import { Module } from '@nestjs/common';
import { MonitorController } from './monitor.controller.js';
import { MonitorService } from './monitor.service.js';
import { MonitorCheckerService } from "./monitor-checker.service.js";
import { MonitorCheckService } from './monitor-check.service.js';
import { MonitorQueueService } from './monitor-queue.service.js';
import { BullModule } from '@nestjs/bullmq';
import { MonitorProcessor } from "./monitor.processor.js";

@Module({
  controllers: [MonitorController],
  providers: [MonitorService, MonitorCheckerService, MonitorCheckService, MonitorQueueService, MonitorProcessor],
  imports: [BullModule.registerQueue({
    name: "monitor-checks",
  })]
})
export class MonitorModule {}
