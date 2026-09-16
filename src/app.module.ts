import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { AuthModule } from './auth/auth.module.js';
import { UserModule } from "./user/user.module.js";
import { ConfigModule } from "@nestjs/config";
import {PrismaModule} from "./prisma/prisma.module.js";

@Module({
  imports: [
    AuthModule,
    UserModule,
    ConfigModule.forRoot({
      envFilePath: [".env"],
      isGlobal: true,
    }),
    PrismaModule,
  ],

  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
