import { IsInt, IsNotEmpty, IsString } from "class-validator";

export class CreateMonitorDto {
  @IsString()
  @IsNotEmpty()
  name: string;
  @IsString()
  @IsNotEmpty()
  url: string;
  @IsInt()
  intervalSeconds: number;
  @IsInt()
  timeoutSeconds: number;
}