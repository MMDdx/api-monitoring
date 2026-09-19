import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { OrganizationService } from "./organization.service.js";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard.js";
import { createOrganizationDto } from "./dtos/create-organization.dto.js";
import { CurrentUser } from "../auth/decorators/current-user.decorator.js";
import type { AuthUser } from "../auth/types/auth-user.type.js";

@Controller("organization")
export class OrganizationController {
  constructor(private readonly OrganizationService: OrganizationService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  createOrganization(@Body() createOrganizationDto: createOrganizationDto, @CurrentUser() user:AuthUser){
    return this.OrganizationService.createOrganization(createOrganizationDto, user);


  }


}
