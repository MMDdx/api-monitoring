import { Module } from '@nestjs/common';
import { IncidentService } from './incident.service.js';
import { IncidentController } from './incident.controller.js';

@Module({
  providers: [IncidentService],
  controllers: [IncidentController]
})
export class IncidentModule {}
