import {Body, Controller, Delete, Get, Param, Patch, Post, UseGuards, Query} from "@nestjs/common";
import { MonitorService } from "./monitor.service.js";
import { CreateMonitorDto } from "./dtos/create-monitor.dto.js";
import type { AuthUser } from "../auth/types/auth-user.type.js";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard.js";
import { CurrentUser } from "../auth/decorators/current-user.decorator.js";
import {UpdateMonitorDto} from "./dtos/update-monitor.dto.js";
import { MonitorQueueService } from "./monitor-queue.service.js";
import {GetChecksQueryDto} from "./dtos/get-checks-query.dto.js";


@Controller("organizations/:organizationId/monitors")
@UseGuards(JwtAuthGuard)
export class MonitorController {
  constructor(
    private monitorService: MonitorService,
    private readonly monitorQueueService: MonitorQueueService,
  ) {}

  @Post()
  createMonitor(
    @Body() createMonitorDto: CreateMonitorDto,
    @Param("organizationId") organizationId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.monitorService.createMonitor(
      organizationId,
      createMonitorDto,
      user,
    );
  }

  @Get()
  getAllMonitors(
    @Param("organizationId") organizationId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.monitorService.getAllMonitors(organizationId, user);
  }

  @Get("/:monitorId")
  getMonitorById(
    @Param("monitorId") monitorId: string,
    @Param("organizationId") organizationId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.monitorService.getMonitorById(monitorId, organizationId, user);
  }

  @Patch("/:monitorId")
  updateMonitor(
    @Body() updateDto: UpdateMonitorDto,
    @Param("monitorId") monitorId: string,
    @Param("organizationId") organizationId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.monitorService.updateMonitor(
      updateDto,
      monitorId,
      organizationId,
      user,
    );
  }

  @Delete("/:monitorId")
  deleteMonitor(
    @Param("monitorId") monitorId: string,
    @Param("organizationId") organizationId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.monitorService.deleteMonitor(monitorId, organizationId, user);
  }

  @Post(":monitorId/pause")
  pauseMonitor(
    @Param("organizationId") organizationId: string,
    @Param("monitorId") monitorId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.monitorService.pauseMonitor(organizationId, monitorId, user);
  }

  @Post(":monitorId/resume")
  resumeMonitor(
    @Param("organizationId") organizationId: string,
    @Param("monitorId") monitorId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.monitorService.resumeMonitor(organizationId, monitorId, user);
  }

  @Get(":monitorId/checks")
  async check(
    @Param("organizationId") organizationId: string,
    @Param("monitorId") monitorId: string,
    @CurrentUser() user: AuthUser,
    @Query() query: GetChecksQueryDto,
  ) {
    return this.monitorService.getChecks(
      organizationId,
      monitorId,
      user,
      query,
    );
  }

  @Post("queue-test")
  async queueTest(@Body('monitorId') monitorId: string) {
    return this.monitorQueueService.addMonitorCheck(monitorId);
  }
}

