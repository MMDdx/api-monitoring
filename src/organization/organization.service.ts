import { Injectable } from '@nestjs/common';
import  {PrismaService} from '../prisma/prisma.service.js';
import { createOrganizationDto } from "./dtos/create-organization.dto.js";
import { AuthUser } from "../auth/types/auth-user.type.js";
import slugify from "slugify";

@Injectable()
export class OrganizationService {
  constructor(private readonly PrismaService: PrismaService) {}

  async createOrganization(dto: createOrganizationDto, user:AuthUser) {
    return await this.PrismaService.organization.create({
      data:{
        name: dto.name,
        slug: slugify(dto.name, {lower: true, strict: true}),
        memberships: {
          create: {
            userId: user.id,
            role : "OWNER"
          }
        }
      }
    })

  }



}
