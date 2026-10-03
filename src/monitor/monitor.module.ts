import { Module } from '@nestjs/common';
import { MonitorController } from './monitor.controller.js';
import { MonitorService } from './monitor.service.js';
import { MonitorCheckerService } from "./monitor-checker.service.js";
import { MonitorCheckService } from './monitor-check.service.js';

@Module({
  controllers: [MonitorController],
  providers: [MonitorService, MonitorCheckerService, MonitorCheckService]
})
export class MonitorModule {}
