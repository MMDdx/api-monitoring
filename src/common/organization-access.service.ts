import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service.js";
import { OrganizationMember } from "../generated/prisma/client.js";


@Injectable()
export class OrganizationAccessService {
  constructor(private readonly prisma: PrismaService) {}

  assertOrganizationAdmin(member: OrganizationMember) {
    if (member.role !== "ADMIN" && member.role !== "OWNER") {
      throw new ForbiddenException("you are not allowed to do this!");
    }
  }

  async getOrganizationWithMembership(
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
}