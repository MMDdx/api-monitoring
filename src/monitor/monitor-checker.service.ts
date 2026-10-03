import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service.js";
import { CheckStatus, Monitor } from "../generated/prisma/client.js";

export interface MonitorCheckResult {
  status: CheckStatus;
  statusCode: number | null;
  responseTime: number;
  errorMessage: string | null;
}


@Injectable()
export class MonitorCheckerService {
  async check(monitor: Monitor): Promise<MonitorCheckResult> {
    const start = Date.now();

    try {
      const response = await fetch(monitor.url, {
        signal: AbortSignal.timeout(monitor.timeoutSeconds * 1000),
      });

      const responseTime = Date.now() - start;

      return {
        status: response.ok ? CheckStatus.SUCCESS : CheckStatus.FAILURE,
        statusCode: response.status,
        responseTime,
        errorMessage: null,
      };
    } catch (error) {
      const responseTime = Date.now() - start;

      return {
        status: CheckStatus.TIMEOUT,
        statusCode: null,
        responseTime,
        errorMessage: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
}