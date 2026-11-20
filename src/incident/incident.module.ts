import { Module } from '@nestjs/common';
import { IncidentService } from './incident.service.js';
import { IncidentController } from './incident.controller.js';
import { CommonModule } from "../common/common.module.js";

@Module({
  imports: [CommonModule],
  providers: [IncidentService],
  controllers: [IncidentController]
})
export class IncidentModule {}
