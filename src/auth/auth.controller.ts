import { Body, Controller, Post } from '@nestjs/common';
import {registerDto} from "./dto/register.dto.js";
import {AuthService} from "./auth.service.js";

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService){}

  @Post('register')
  register(@Body() registerDto:registerDto){
    return this.authService.register(registerDto)
  }


}
