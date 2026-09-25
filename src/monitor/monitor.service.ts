import { Injectable } from '@nestjs/common';
import { PrismaService } from "../prisma/prisma.service.js";
import { CreateMonitorDto } from "./dtos/create-monitor.dto.js";
import { AuthUser } from "../auth/types/auth-user.type.js";

@Injectable()
export class MonitorService {
  constructor(private readonly prisma: PrismaService) {}


  async createMonitor(organizationId: string, createMonitorDto: CreateMonitorDto, user: AuthUser) {

  }
}
