import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import {UserModule} from "../user/user.module.js";
import {LocalStrategy} from "./strategies/local.strategy.js";
import {JwtStrategy} from "./strategies/jwt.strategy.js";
import {PassportModule} from "@nestjs/passport";
import {JwtModule} from "@nestjs/jwt";

@Module({
  controllers: [AuthController],
  providers: [AuthService, LocalStrategy, JwtStrategy],
  imports: [UserModule, PassportModule, JwtModule.register({})],
})
export class AuthModule {}
