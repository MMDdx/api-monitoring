import { IsString } from 'class-validator';

export class registerDto {
  @IsString()
  email: string;

  @IsString()
  password: string;

  @IsString()
  confirmPassword: string;
}