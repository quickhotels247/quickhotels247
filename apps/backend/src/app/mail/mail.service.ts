import {
  Inject,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from "@nestjs/common";
import nodemailer, { type Transporter } from "nodemailer";
import { mailConfig, type MailConfig } from "./mail.config.js";

export interface MailMessage {
  to: string;
  subject: string;
  text: string;
  html: string;
}

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly transporter: Transporter | null;

  constructor(@Inject(mailConfig.KEY) private readonly config: MailConfig) {
    this.transporter = config.host
      ? nodemailer.createTransport({
          host: config.host,
          port: config.port,
          secure: config.port === 465,
          connectionTimeout: 10_000,
          greetingTimeout: 10_000,
          socketTimeout: 20_000,
          auth: config.user
            ? { user: config.user, pass: config.pass }
            : undefined,
        })
      : null;
    if (!this.transporter) {
      this.logger.warn(
        "SMTP_HOST is not set: emails will be printed here instead of sent.",
      );
    }
  }

  async send(message: MailMessage): Promise<void> {
    if (!this.transporter) {
      if (process.env.NODE_ENV === "production") {
        throw new ServiceUnavailableException("Email isn't configured.");
      }
      this.logger.log(
        `Email to ${message.to}: ${message.subject}\n${message.text}`,
      );
      return;
    }
    try {
      await this.transporter.sendMail({ from: this.config.from, ...message });
    } catch (error) {
      this.logger.error(
        `Sending email to ${message.to} failed`,
        error as Error,
      );
      throw new ServiceUnavailableException(
        "We couldn't send the email. Please try again in a moment.",
      );
    }
  }
}
