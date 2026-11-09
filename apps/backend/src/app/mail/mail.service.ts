import { Inject, Injectable, Logger, ServiceUnavailableException } from "@nestjs/common";
import nodemailer, { type Transporter } from "nodemailer";
import { PrismaService } from "../common/database/prisma.service.js";
import { mailConfig, type MailConfig } from "./mail.config.js";
import type { MailAttachment } from "./mime.js";
import { GmailApiTransport, MailSendError } from "./transports/gmail-api.transport.js";

export interface MailMessage {
  to: string;
  subject: string;
  text: string;
  html: string;
  // Files sent with it (e.g. the PDF voucher or e-ticket).
  attachments?: MailAttachment[];
}

// What a send is about, for the notifications table (admin and support).
export interface MailContext {
  template: string;
  userId?: string | null;
  bookingId?: string | null;
}

const ATTEMPTS = 3;
const pause = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Sends email through the Gmail API (preferred on Render, which blocks SMTP),
// else SMTP, else (development) prints it. Every send is recorded in
// `notifications` with its outcome; temporary failures are retried.
@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly gmail: GmailApiTransport | null;
  private readonly smtp: Transporter | null;

  constructor(
    @Inject(mailConfig.KEY) private readonly config: MailConfig,
    private readonly db: PrismaService,
  ) {
    this.gmail = config.gmail ? new GmailApiTransport(config.gmail) : null;
    this.smtp =
      !this.gmail && config.host
        ? nodemailer.createTransport({
            host: config.host,
            port: config.port,
            secure: config.port === 465,
            connectionTimeout: 10_000,
            greetingTimeout: 10_000,
            socketTimeout: 20_000,
            auth: config.user ? { user: config.user, pass: config.pass } : undefined,
          })
        : null;
    if (this.gmail) this.logger.log("Email is sent through the Gmail API.");
    else if (!this.smtp) this.logger.warn("No email sending set up (GMAIL_* or SMTP_HOST): emails will be printed here instead.");
  }

  get configured() {
    return Boolean(this.gmail || this.smtp);
  }

  // Sends now and records the outcome. Throws a friendly 503 when it fails.
  async send(message: MailMessage, context: MailContext = { template: "other" }): Promise<void> {
    if (!this.configured) {
      if (process.env.NODE_ENV === "production") throw new ServiceUnavailableException("Email isn't configured.");
      this.logger.log(`Email to ${message.to}: ${message.subject}\n${message.text}`);
      return;
    }
    const record = await this.db.notification
      .create({ data: { channel: "EMAIL", template: context.template, recipient: message.to, userId: context.userId ?? null, bookingId: context.bookingId ?? null } })
      .catch((error: Error) => {
        // Recording must never stop the email itself.
        this.logger.warn(`Could not record email: ${error.message}`);
        return null;
      });
    try {
      const reference = await this.deliver(message);
      if (record) await this.db.notification.update({ where: { id: record.id }, data: { status: "SENT", sentAt: new Date(), providerReference: reference } }).catch(() => undefined);
    } catch (error) {
      const reason = (error as Error).message.slice(0, 500);
      this.logger.error(`Sending "${context.template}" email to ${message.to} failed: ${reason}`);
      if (record) await this.db.notification.update({ where: { id: record.id }, data: { status: "FAILED", error: reason } }).catch(() => undefined);
      throw new ServiceUnavailableException("We couldn't send the email. Please try again in a moment.");
    }
  }

  // Sends without making the caller wait or fail (welcome emails and similar).
  sendInBackground(message: MailMessage, context: MailContext): void {
    void this.send(message, context).catch(() => undefined);
  }

  private async deliver(message: MailMessage): Promise<string | null> {
    for (let attempt = 1; ; attempt++) {
      try {
        if (this.gmail) return await this.gmail.send({ from: this.config.from, ...message });
        const info = await this.smtp!.sendMail({ from: this.config.from, ...message });
        return info.messageId ?? null;
      } catch (error) {
        const retryable = error instanceof MailSendError ? error.retryable : true;
        if (!retryable || attempt >= ATTEMPTS) throw error;
        await pause(500 * 2 ** (attempt - 1));
      }
    }
  }
}
