import { Module } from '@nestjs/common';
import { MonitorController } from './monitor.controller.js';
import { MonitorService } from './monitor.service.js';
import { MonitorCheckerService } from "./monitor-checker.service.js";
import { MonitorCheckService } from './monitor-check.service.js';
import { MonitorQueueService } from './monitor-queue.service.js';
import { BullModule } from '@nestjs/bullmq';
import { MonitorProcessor } from "./monitor.processor.js";
import { NotificationsService } from '../notifications/notifications.service.js';
import { MonitorLockService } from './monitor-lock.service.js';
import { CommonModule } from "../common/common.module.js";
import { NotificationsModule } from "../notifications/notifications.module.js";

@Module({
  controllers: [MonitorController],
  providers: [MonitorService, MonitorCheckerService,
    MonitorCheckService, MonitorQueueService,
    MonitorProcessor
  , MonitorLockService],

  imports: [BullModule.registerQueue({
    name: "monitor-checks",
  }), CommonModule, NotificationsModule],
})
export class MonitorModule {}
