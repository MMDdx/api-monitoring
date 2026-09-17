import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import {UserModule} from "../user/user.module.js";

@Module({
  controllers: [AuthController],
  providers: [AuthService],
  imports: [UserModule]
})
export class AuthModule {}
