import { Body, Controller, Post } from '@nestjs/common';

@Controller('auth')
export class AuthController {

  @Post('register')
  register(@Body() body:any){

  }


}
