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
import { OrganizationMember, Prisma } from "../generated/prisma/client.js";

@Injectable()
export class OrganizationService {
  constructor(private readonly prisma: PrismaService) {}

  async createOrganization(dto: createOrganizationDto, user: AuthUser) {
    return await this.prisma.organization.create({
      data: {
        name: dto.name,
        slug: slugify(dto.name, { lower: true, strict: true }),
        memberships: {
          create: {
            userId: user.id,
            role: "OWNER",
          },
        },
      },
    });
  }

  async getOrganizations(user: AuthUser) {
    return this.prisma.organization.findMany({
      where: {
        memberships: {
          some: {
            userId: user.id,
          },
        },
      },
    });
  }

  async getOrganizationById(id: any, user: AuthUser) {
    return this.prisma.organization.findUnique({
      where: {
        id,
        memberships: {
          some: {
            userId: user.id,
          },
        },
      },
    });
  }

  async addMemberToOrganization(id: string, addMemberDto: AddMemberToOrganizationDto, user: AuthUser,) {
    const { organization, membership } = await this.getOrganizationWithMembership(id, user.id);

    this.assertOrganizationAdmin(membership);

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
          error.code === "P2002"
        ) {
          throw new ConflictException(
            "User is already a member of this organization.",
          );
        }

        throw error;
      }
  }

  async deleteMemberFromOrganization(id: string, memberId: string, user: AuthUser) {
    const { membership,organization} = await this.getOrganizationWithMembership(id, user.id);

    this.assertOrganizationAdmin(membership);

    if (membership.role === "ADMIN"){
      const targetMembership = await this.prisma.organizationMember.findUnique({
        where: {
          organizationId_userId: {
            organizationId: id,
            userId: memberId,
          },
        },
      });

      if (!targetMembership) {
        throw new NotFoundException("Member not found in this organization.");
      }
      if(targetMembership.role !== "MEMBER"){
        throw new ForbiddenException("you cant delete ANOTHER Admin!");
      }
    }
    return await this.prisma.organizationMember.delete({
      where: {
        organizationId_userId: {
          organizationId: organization.id,
          userId: memberId,
        }
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

  private assertOrganizationAdmin(member: OrganizationMember){
    if (member.role !== "ADMIN" && member.role !== "OWNER") {
      throw new ForbiddenException("you are not allowed to do this!");
    }
  }
}
