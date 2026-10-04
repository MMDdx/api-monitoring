import { Module } from '@nestjs/common';
import { MonitorController } from './monitor.controller.js';
import { MonitorService } from './monitor.service.js';
import { MonitorCheckerService } from "./monitor-checker.service.js";
import { MonitorCheckService } from './monitor-check.service.js';
import { MonitorQueueService } from './monitor-queue.service.js';

@Module({
  controllers: [MonitorController],
  providers: [MonitorService, MonitorCheckerService, MonitorCheckService, MonitorQueueService]
})
export class MonitorModule {}
