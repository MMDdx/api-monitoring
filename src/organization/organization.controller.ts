import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import { OrganizationService } from "./organization.service.js";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard.js";
import { createOrganizationDto } from "./dtos/create-organization.dto.js";
import { CurrentUser } from "../auth/decorators/current-user.decorator.js";
import type { AuthUser } from "../auth/types/auth-user.type.js";
import {AddMemberToOrganizationDto} from "./dtos/add-member.dto.js";

@Controller("organization")
@UseGuards(JwtAuthGuard)
export class OrganizationController {
  constructor(private readonly OrganizationService: OrganizationService) {}

  @Post()
  createOrganization(
    @Body() createOrganizationDto: createOrganizationDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.OrganizationService.createOrganization(
      createOrganizationDto,
      user,
    );
  }

  @Get()
  getOrganizations(@CurrentUser() user: AuthUser) {
    return this.OrganizationService.getOrganizations(user);
  }

  @Get("/:id")
  getOrganization(@Param("id") id: number, @CurrentUser() user: AuthUser) {
    return this.OrganizationService.getOrganizationById(id, user);
  }

  @Post('/:id/members')
  addMemberToOrganization(@Param("id") id: string, @CurrentUser() user: AuthUser, @Body() addMemberDto: AddMemberToOrganizationDto) {
    return this.OrganizationService.addMemberToOrganization(id, addMemberDto,user);
  }
}
