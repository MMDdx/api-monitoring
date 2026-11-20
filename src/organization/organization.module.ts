import { Module } from '@nestjs/common';
import { OrganizationController } from './organization.controller.js';
import { OrganizationService } from './organization.service.js';
import { CommonModule } from "../common/common.module.js";

@Module({
  controllers: [OrganizationController],
  providers: [OrganizationService],
  imports: [CommonModule],
})
export class OrganizationModule {}
