import {IsNotEmpty, IsString} from "class-validator";
import {OrganizationRole} from "../../generated/prisma/enums.js";



export class AddMemberToOrganizationDto {
	@IsString()
	@IsNotEmpty()
	memberId: string;

	@IsString()
	@IsNotEmpty()
	role: OrganizationRole;
}