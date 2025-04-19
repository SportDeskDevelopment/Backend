import { MailerModule } from "@nestjs-modules/mailer";
import { HandlebarsAdapter } from "@nestjs-modules/mailer/dist/adapters/handlebars.adapter";
import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { join } from "path";
import { envConfig, EnvConfig } from "../config/config.env";
import { EmailService } from "./email.service";

@Module({
  imports: [
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (config: EnvConfig) => ({
        transport: {
          host: config.smtpHost,
          port: config.smtpPort,
          secure: config.nodeEnv === "production",
          auth: {
            user: config.smtpUser,
            pass: config.smtpPass,
          },
        },
        defaults: {
          from: `No Reply <${config.smtpFrom}>`,
        },
        template: {
          dir: join(__dirname, "./templates"),
          adapter: new HandlebarsAdapter(),
          options: {
            strict: true,
          },
        },
      }),
      inject: [envConfig.KEY],
    }),
  ],
  providers: [EmailService],
  exports: [EmailService],
})
export class EmailModule {}
