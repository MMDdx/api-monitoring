import { IsString } from 'class-validator';

class registerDto {
  @IsString()
  email: string;

  @IsString()
  password: string;

  @IsString()
  confirmPassword: string;
}