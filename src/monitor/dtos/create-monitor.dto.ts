import { IsInt, IsNotEmpty, IsOptional, IsString } from "class-validator";

export class CreateMonitorDto {
  @IsString()
  @IsNotEmpty()
  name: string;
  @IsString()
  @IsNotEmpty()
  url: string;
  @IsInt()
  @IsOptional()
  intervalSeconds: number;
  @IsInt()
  @IsOptional()
  timeoutSeconds: number;
}