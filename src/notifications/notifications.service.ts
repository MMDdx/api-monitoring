import { Injectable, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import nodemailer, { Transporter } from "nodemailer";

@Injectable()
export class NotificationsService implements OnModuleInit {
  private transporter: Transporter;

  constructor(private readonly configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.getOrThrow<string>("MAILEROO_HOST"),
      port: this.configService.getOrThrow<number>("MAILEROO_PORT"),
      secure: false,
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 20000,
      auth: {
        user: this.configService.getOrThrow<string>("MAILEROO_USER"),
        pass: this.configService.getOrThrow<string>("MAILEROO_PASSWORD"),
      },
    });
  }

  async onModuleInit() {
    await this.transporter.verify();
  }

  async sendEmail(to: string, subject: string, text: string) {

    try {
      const info = await this.transporter.sendMail({
        from: this.configService.getOrThrow<string>("MAILEROO_FROM"),
        to,
        subject,
        text,
      });

      return info;
    } catch (error) {
      console.error("Email delivery failed:", error);
      throw error;
    }
  }
}
