import { Module } from '@nestjs/common';
import { MonitorController } from './monitor.controller.js';
import { MonitorService } from './monitor.service.js';
import { MonitorCheckerService } from "./monitor-checker.service.js";

@Module({
  controllers: [MonitorController],
  providers: [MonitorService, MonitorCheckerService]
})
export class MonitorModule {}
