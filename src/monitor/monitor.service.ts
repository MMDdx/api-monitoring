import {ForbiddenException, Injectable, NotFoundException} from '@nestjs/common';
import { PrismaService } from "../prisma/prisma.service.js";
import { CreateMonitorDto } from "./dtos/create-monitor.dto.js";
import { AuthUser } from "../auth/types/auth-user.type.js";
import {OrganizationMember} from "../generated/prisma/client.js";
import {UpdateMonitorDto} from "./dtos/update-monitor.dto.js";
import { MonitorCheckService } from './monitor-check.service.js';
import { MonitorCheckerService } from './monitor-checker.service.js';
import { MonitorQueueService } from "./monitor-queue.service.js";

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

    return this.prisma.monitor.update({
      where: {
        id: monitorId,
      },
      data: {
        name: updateDto.name,
        intervalSeconds: updateDto.intervalSeconds,
        timeoutSeconds: updateDto.timeoutSeconds,
      },
    });
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

    return this.prisma.monitor.delete({
      where: {
        id: monitorId,
      },
    });
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

    return this.prisma.monitor.update({
      where: {
        id: monitorId,
      },
      data: {
        status: "PAUSED",
      },
    });
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
}
