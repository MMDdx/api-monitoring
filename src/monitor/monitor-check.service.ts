import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service.js";
import { MonitorCheckResult } from "./monitor-checker.service.js";


@Injectable()
export class MonitorCheckService {
  constructor(private readonly prisma: PrismaService) {}

  async createCheck(monitorId: string, result: MonitorCheckResult) {
    return this.prisma.monitorCheck.create({
      data: {
        monitorId,
        status: result.status,
        statusCode: result.statusCode,
        responseTime: result.responseTime,
        errorMessage: result.errorMessage,
      },
    });
  }
}