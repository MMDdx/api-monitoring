import { Body, Controller, Param, Post, UseGuards } from "@nestjs/common";
import { MonitorService } from "./monitor.service.js";
import { CreateMonitorDto } from "./dtos/create-monitor.dto.js";
import type { AuthUser } from "../auth/types/auth-user.type.js";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard.js";
import { CurrentUser } from "../auth/decorators/current-user.decorator.js";

@Controller("organizations/:organizationId/monitors")
@UseGuards(JwtAuthGuard)
export class MonitorController {
  constructor(private monitorService: MonitorService) {}

  @Post()
  createMonitor(@Body() createMonitorDto: CreateMonitorDto, @Param("organizationId") organizationId: string, @CurrentUser() user: AuthUser) {
    return this.monitorService.createMonitor(organizationId, createMonitorDto,user);
  }
}
