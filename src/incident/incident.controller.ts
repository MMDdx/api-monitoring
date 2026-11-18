import { Body, Controller, Get, Post, Query, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { CurrentUser } from "../auth/decorators/current-user.decorator.js";
import  type { AuthUser } from "../auth/types/auth-user.type.js";
import { IncidentService } from "./incident.service.js";
import { CreateIncidentDto } from "./dtos/create-incident.dto.js";

@Controller('incident')
@UseGuards(AuthGuard)
export class IncidentController {
  constructor(private readonly incidentService: IncidentService) {}
  
  @Get("/:organizationId")
  getAllIncidents(@Query() organizationId : string ,@CurrentUser() currentUser: AuthUser) {
    return this.incidentService.getAllIncidents(currentUser);
  }

  @Post()
  createIncident(@Body() createIncidentDto: CreateIncidentDto, @CurrentUser() currentUser: AuthUser) {
    return this.incidentService.createIncident(createIncidentDto, currentUser)
  }

  @Get("/:organizationId/:incidentId")
  getIncident(@Query() incidentId: string ,@Query() organizationId :string, @CurrentUser() currentUser: AuthUser) {
    return this.incidentService.getIncident(incidentId, organizationId, currentUser);
  }

}
