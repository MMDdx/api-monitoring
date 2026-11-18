import { IsNotEmpty, IsString } from "class-validator";

export class CreateIncidentDto {
  @IsNotEmpty()
  @IsString()
  title: string

  @IsNotEmpty()
  @IsString()
  monitorId: string
}
