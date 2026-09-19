import { IsNotEmpty, IsString, MaxLength, MinLength } from "class-validator";

export class createOrganizationDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(20)
  name: string;
}