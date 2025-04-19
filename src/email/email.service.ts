import { Injectable } from "@nestjs/common";
import { MailerService } from "@nestjs-modules/mailer";
import { EMAIL_TEMPLATES } from "./constants/email-templates";

@Injectable()
export class EmailService {
  constructor(private mailerService: MailerService) {}

  async sendConfirmationEmail(email: string, code: string): Promise<void> {
    await this.mailerService.sendMail({
      to: email,
      subject: "Email confirmation",
      template: EMAIL_TEMPLATES.CONFIRMATION,
      context: {
        code,
        expiresIn: 15,
      },
    });
  }
}
