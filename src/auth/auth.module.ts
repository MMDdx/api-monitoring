import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import {UserModule} from "../user/user.module.js";
import {LocalStrategy} from "./strategies/local.strategy.js";
import {JwtStrategy} from "./strategies/jwt.strategy.js";
import {PassportModule} from "@nestjs/passport";
import {JwtModule} from "@nestjs/jwt";
import {ConfigModule, ConfigService} from "@nestjs/config";
import type {StringValue} from "ms";

@Module({
  controllers: [AuthController],
  providers: [AuthService, LocalStrategy, JwtStrategy],
  imports: [UserModule, PassportModule, JwtModule.registerAsync({
    imports: [ConfigModule],
    inject: [ConfigService],

    useFactory: (configService: ConfigService) => ({
      secret: configService.getOrThrow<string>('JWT_SECRET'),
      signOptions: {
        expiresIn: (configService.get<string>('EXPIRES_IN') ?? '30m') as StringValue
      }
    })
  }),],
})
export class AuthModule {}
