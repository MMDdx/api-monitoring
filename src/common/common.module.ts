import { OrganizationAccessService } from "./organization-access.service.js";
import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module.js";

@Module({
  providers: [OrganizationAccessService],
  exports: [OrganizationAccessService],
  imports: [PrismaModule],
})
export class CommonModule {}
