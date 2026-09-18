import {Body, Controller, Post, UseGuards, Request} from '@nestjs/common';
import {registerDto} from "./dto/register.dto.js";
import {AuthService} from "./auth.service.js";
import {LocalAuthGuard} from "./guards/local-auth.guard.js";
import {CurrentUser} from "./decorators/current-user.decorator.js";
import type {AuthUser} from "./types/auth-user.type.js";

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService){}

  @Post('register')
  register(@Body() registerDto:registerDto){
    return this.authService.register(registerDto)
  }

  @Post('login')
  @UseGuards(LocalAuthGuard)
  login(@CurrentUser() user:AuthUser) {
    return this.authService.login(user);
  }

}
