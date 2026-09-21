import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException
} from '@nestjs/common';
import  {PrismaService} from '../prisma/prisma.service.js';
import { createOrganizationDto } from "./dtos/create-organization.dto.js";
import { AuthUser } from "../auth/types/auth-user.type.js";
import slugify from "slugify";
import {AddMemberToOrganizationDto} from "./dtos/add-member.dto.js";
import { Prisma } from '../generated/prisma/client.js';

@Injectable()
export class OrganizationService {
  constructor(private readonly prisma: PrismaService) {}

  async createOrganization(dto: createOrganizationDto, user:AuthUser) {
    return await this.prisma.organization.create({
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


  async getOrganizations(user: AuthUser) {
    return this.prisma.organization.findMany({
      where: {
        memberships: {
          some: {
            userId: user.id
          }
        }
      }
    })

  }

  async getOrganizationById(id: any, user: AuthUser) {
    return this.prisma.organization.findUnique({
      where:{
        id,
        memberships: {
          some:{
            userId: user.id
          }
        }
      }
    })
  }

  async addMemberToOrganization(id: string, addMemberDto: AddMemberToOrganizationDto, user: AuthUser) {
    const organization = await this.prisma.organization.findUnique({
        where:{
          id
        },
      include: {
          memberships: true
      }
    });
    if (!organization) {
      throw new NotFoundException("Organization not found!");
    }
    if(!organization.memberships.find((obj)=> {
      return obj.userId == user.id && (obj.role == "ADMIN" || obj.role == "OWNER")
    })) {
      throw new ForbiddenException("Not Allowed to do this!")
    }

    if (organization.memberships.find((obj)=> {}))

      try {
        return await this.prisma.organizationMember.create({
          data: {
            organizationId: id,
            userId: addMemberDto.memberId,
            role: addMemberDto.role,
          },
        });
      } catch (error) {
        if (
            error instanceof Prisma.PrismaClientKnownRequestError &&
            error.code === 'P2002'
        ) {
          throw new ConflictException(
              'User is already a member of this organization.',
          );
        }

        throw error;
      }
  }
}
