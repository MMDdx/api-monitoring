import { Injectable } from '@nestjs/common';
import { PrismaService } from "../prisma/prisma.service.js";
import { CurrentUser } from "../auth/decorators/current-user.decorator.js";
import type { AuthUser } from "../auth/types/auth-user.type.js";
import { CreateIncidentDto } from "./dtos/create-incident.dto.js";

@Injectable()
export class IncidentService {
  constructor(private readonly prisma: PrismaService) {}

  async getAllIncidents(@CurrentUser() currentUser: AuthUser) {
    return this.prisma.incident.findMany()
  }

  async createIncident(createIncidentDto: CreateIncidentDto, currentUser: AuthUser) {
    return this.prisma.incident.create({
      data: {
        title: createIncidentDto.title,
        monitorId: createIncidentDto.monitorId
      }
    })
  }

  async getIncident(organizationId:string, incidentId: string, @CurrentUser() currentUser: AuthUser) {
    return this.prisma.incident.findFirst({
      where: {
        id: incidentId
      }
    })
  }
}
