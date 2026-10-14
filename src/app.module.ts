import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { AuthModule } from './auth/auth.module.js';
import { UserModule } from "./user/user.module.js";
import { ConfigModule, ConfigService } from "@nestjs/config";
import {PrismaModule} from "./prisma/prisma.module.js";
import { OrganizationModule } from './organization/organization.module.js';
import { MonitorModule } from './monitor/monitor.module.js';
import {BullModule} from "@nestjs/bullmq";
import { createConnection } from "net";

@Module({
  imports: [
    AuthModule,
    UserModule,
    ConfigModule.forRoot({
      envFilePath: [".env"],
      isGlobal: true,
    }),
    PrismaModule,
    OrganizationModule,
    MonitorModule,
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory : (configService: ConfigService) => ({
        connection: {
          host: configService.get<string>("REDIS_HOST", "127.0.0.1"),
          port: configService.get<string>("REDIS_PORT", "6379")
        },

      })

    }),
  ],

  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
