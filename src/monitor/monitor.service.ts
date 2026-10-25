import {ForbiddenException, Injectable, NotFoundException} from '@nestjs/common';
import { PrismaService } from "../prisma/prisma.service.js";
import { CreateMonitorDto } from "./dtos/create-monitor.dto.js";
import { AuthUser } from "../auth/types/auth-user.type.js";
import {CheckStatus, OrganizationMember} from "../generated/prisma/client.js";
import {UpdateMonitorDto} from "./dtos/update-monitor.dto.js";
import { MonitorCheckService } from './monitor-check.service.js';
import { MonitorCheckerService } from './monitor-checker.service.js';
import { MonitorQueueService } from "./monitor-queue.service.js";
import { GetChecksQueryDto } from './dtos/get-checks-query.dto.js';
import {MonitorStatsQueryDto} from "./dtos/monitor-stats-query.dto.js";

@Injectable()
export class MonitorService {
  constructor(
    private readonly prisma: PrismaService,
    private monitorCheckService: MonitorCheckService,
    private monitorCheckerService: MonitorCheckerService,
    private monitorQueueService: MonitorQueueService,
  ) {}

  async createMonitor(
    organizationId: string,
    createMonitorDto: CreateMonitorDto,
    user: AuthUser,
  ) {
    const { membership } = await this.getOrganizationWithMembership(
      organizationId,
      user.id,
    );
    this.assertOrganizationAdmin(membership);
    return this.prisma.monitor.create({
      data: {
        name: createMonitorDto.name,
        url: createMonitorDto.url,
        timeoutSeconds: createMonitorDto.timeoutSeconds,
        intervalSeconds: createMonitorDto.intervalSeconds,
        organizationId,
      },
    });
  }

  async getAllMonitors(organizationId: string, user: AuthUser) {
    const {} = await this.getOrganizationWithMembership(
      organizationId,
      user.id,
    );

    return this.prisma.monitor.findMany({
      where: {
        organizationId,
      },
    });
  }

  async getMonitorById(
    monitorId: string,
    organizationId: string,
    user: AuthUser,
  ) {
    const {} = await this.getOrganizationWithMembership(
      organizationId,
      user.id,
    );

    const monitor = await this.prisma.monitor.findUnique({
      where: {
        id: monitorId,
        organizationId
      },
    });
    if (!monitor) {
      throw new NotFoundException(`Monitor with id ${monitorId} not found!`);
    }
    return monitor;
  }

  async updateMonitor(
    updateDto: UpdateMonitorDto,
    monitorId: string,
    organizationId: string,
    user: AuthUser,
  ) {
    const { membership } = await this.getOrganizationWithMembership(
      organizationId,
      user.id,
    );
    this.assertOrganizationAdmin(membership);

    const monitor = await this.prisma.monitor.findFirst({
      where: {
        id: monitorId,
        organizationId,
      },
    });

    if (!monitor) {
      throw new NotFoundException("Monitor not found.");
    }

    const currentMonitor = await this.prisma.monitor.update({
      where: {
        id: monitorId,
      },
      data: {
        name: updateDto.name,
        intervalSeconds: updateDto.intervalSeconds,
        timeoutSeconds: updateDto.timeoutSeconds,
      },
    });
    if (currentMonitor.status === "ACTIVE"){
      await this.monitorQueueService.monitorScheduleCheck(monitorId, currentMonitor.intervalSeconds)
    }

    return currentMonitor;
  }

  async deleteMonitor(
    monitorId: string,
    organizationId: string,
    user: AuthUser,
  ) {
    const { membership } = await this.getOrganizationWithMembership(
      organizationId,
      user.id,
    );
    this.assertOrganizationAdmin(membership);

    const monitor = await this.prisma.monitor.findFirst({
      where: {
        id: monitorId,
        organizationId,
      },
    });
    if (!monitor) {
      throw new NotFoundException("Monitor not found!");
    }

    const currentMonitor =await this.prisma.monitor.delete({
      where: {
        id: monitorId,
      },
    });
    await this.monitorQueueService.removeMonitorCheck(monitorId);
    return currentMonitor;
  }

  private async getOrganizationWithMembership(
    organizationId: string,
    userId: string,
  ) {
    const organization = await this.prisma.organization.findUnique({
      where: {
        id: organizationId,
      },
      include: {
        memberships: true,
      },
    });

    if (!organization) {
      throw new NotFoundException("Organization not found!");
    }

    const membership = organization.memberships.find(
      (membership) => membership.userId === userId,
    );

    if (!membership) {
      throw new ForbiddenException(
        "You are not a member of this organization.",
      );
    }

    return {
      organization,
      membership,
    };
  }

  private assertOrganizationAdmin(member: OrganizationMember) {
    if (member.role !== "ADMIN" && member.role !== "OWNER") {
      throw new ForbiddenException("you are not allowed to do this!");
    }
  }

  async pauseMonitor(
    organizationId: string,
    monitorId: string,
    user: AuthUser,
  ) {
    const { membership } = await this.getOrganizationWithMembership(
      organizationId,
      user.id,
    );
    this.assertOrganizationAdmin(membership);

    const monitor= await this.prisma.monitor.update({
      where: {
        id: monitorId,
      },
      data: {
        status: "PAUSED",
      },
    });
    await this.monitorQueueService.removeMonitorCheck(monitorId);
    return monitor;
  }

  async resumeMonitor(
    organizationId: string,
    monitorId: string,
    user: AuthUser,
  ) {
    const { membership } = await this.getOrganizationWithMembership(
      organizationId,
      user.id,
    );
    this.assertOrganizationAdmin(membership);



    const activeMonitor = await this.prisma.monitor.update({
      where: {
        id: monitorId,
      },
      data: {
        status: "ACTIVE",
      },
    });
    await this.monitorQueueService.monitorScheduleCheck(
      monitorId,
      activeMonitor.intervalSeconds,
    );
    return activeMonitor;
  }

  async runCheck(organizationId: string, monitorId: string, user: AuthUser) {
    const { membership } = await this.getOrganizationWithMembership(
      organizationId,
      user.id,
    );

    this.assertOrganizationAdmin(membership);

    const monitor = await this.prisma.monitor.findFirst({
      where: {
        id: monitorId,
        organizationId,
      },
    });

    if (!monitor) {
      throw new NotFoundException("Monitor not found.");
    }

    const result = await this.monitorCheckerService.check(monitor);

    return this.prisma.monitorCheck.create({
      data: {
        monitorId: monitor.id,
        status: result.status,
        statusCode: result.statusCode,
        responseTime: result.responseTime,
        errorMessage: result.errorMessage,
      },
    });
  }

  async getChecks(organizationId: string, monitorId: string, user: AuthUser, query: GetChecksQueryDto) {
    await this.getOrganizationWithMembership(organizationId,user.id);

    const monitor = await this.prisma.monitor.findFirst({
      where:{
        id: monitorId,
        organizationId,
      },
      select:{
        id : true
      }
    })

    if (!monitor) {
      throw new NotFoundException("Monitor not found.");
    }

    const skip = (query.page - 1) * query.limit;

    const [checks, total] = await Promise.all([
      this.prisma.monitorCheck.findMany({
        where: { monitorId: monitor.id },
        orderBy: { checkedAt: "desc" },
        skip,
        take: query.limit,
      }),
      this.prisma.monitorCheck.count({
        where: { monitorId: monitor.id },
      }),
    ]);

    return {
      data: checks,
      total,
      limit: query.limit,
      totalPages: Math.ceil(total / query.limit)
    }
  }

  async getMonitorChecksStats(organizationId: string,monitorId: string, query: MonitorStatsQueryDto, user: AuthUser) {
      await this.getOrganizationWithMembership(organizationId,user.id)

    const endDate = new Date();
    const startDate = new Date(endDate);

    switch (query.period) {
      case '1h':
        startDate.setHours(startDate.getHours() - 1);
        break;
      case '7d':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case '24h':
      default:
        startDate.setHours(startDate.getHours() - 24);
        break;
    }

    const [stats] = await this.prisma.$queryRaw<
        {
          totalChecks: number;
          failedChecks: number;
          successfulChecks: number;
          averageResponseTime: number | null;
        }[]
    >`
      SELECT
        COUNT(*)::int AS "totalChecks",
        COUNT(*) FILTER (
      WHERE status IN ('FAILURE', 'TIMEOUT')
    )::int AS "failedChecks",
        COUNT(*) FILTER (
      WHERE status = 'SUCCESS'
    )::int AS "successfulChecks",
        AVG("responseTime") FILTER (
      WHERE status = 'SUCCESS'
    )::float8 AS "averageResponseTime"
      FROM "MonitorCheck"
      WHERE "monitorId" = ${monitorId}
        AND "checkedAt" >= ${startDate}
        AND "checkedAt" < ${endDate}
    `;

    const uptimePercentage = stats.totalChecks === 0 ? null : (stats.successfulChecks / stats.totalChecks) * 100;

    return {
      period: query.period,
      totalChecks: stats.totalChecks,
      successfulChecks: stats.successfulChecks,
      failedChecks: stats.failedChecks,
      uptimePercentage,
      averageResponseTime: stats.averageResponseTime,
    };
  }


}
