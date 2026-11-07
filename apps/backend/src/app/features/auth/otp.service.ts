import {
  createHash,
  randomBytes,
  randomInt,
  timingSafeEqual,
} from "node:crypto";
import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
} from "@nestjs/common";
import type {
  SendSignupOtpResponse,
  VerifySignupOtpResponse,
} from "@quickhotels/types/users";
import { MailService } from "../../mail/mail.service.js";
import { otpEmail } from "../../mail/templates/otp.template.js";
import { authConfig, type AuthConfig } from "./auth.config.js";
import { EmailVerificationRepository } from "./email-verification.repository.js";

const sha256 = (value: string) =>
  createHash("sha256").update(value).digest("hex");
// Salted with the email so equal codes for different people hash differently.
const hashCode = (email: string, code: string) => sha256(`${email}:${code}`);

const sameHash = (a: string, b: string) =>
  a.length === b.length && timingSafeEqual(Buffer.from(a), Buffer.from(b));

const tooMany = (message: string) =>
  new HttpException(message, HttpStatus.TOO_MANY_REQUESTS);

// Emails a 6-digit code before sign-up and confirms it.
@Injectable()
export class OtpService {
  constructor(
    private readonly verifications: EmailVerificationRepository,
    private readonly mail: MailService,
    @Inject(authConfig.KEY) private readonly config: AuthConfig,
  ) {}

  async send(email: string, firstName: string): Promise<SendSignupOtpResponse> {
    const existing = await this.verifications.find(email);
    if (existing) {
      const waitMs =
        existing.lastSentAt.getTime() +
        this.config.otpResendCooldownMs -
        Date.now();
      if (waitMs > 0) {
        throw tooMany(
          `Please wait ${Math.ceil(waitMs / 1000)} seconds before requesting another code.`,
        );
      }
    }

    this.countEmailSent();
    const code = randomInt(0, 1_000_000).toString().padStart(6, "0");
    const expiresAt = new Date(Date.now() + this.config.otpTtlMs);
    const stored = await this.verifications.upsertCode(
      email,
      hashCode(email, code),
      expiresAt,
      this.config.otpResendCooldownMs,
    );
    if (!stored) {
      throw tooMany("Please wait a minute before requesting another code.");
    }
    await this.mail.send(
      otpEmail(
        email,
        firstName,
        code,
        Math.round(this.config.otpTtlMs / 60000),
      ), { template: "signup-otp" });

    return {
      email,
      expiresAt: expiresAt.toISOString(),
      resendAvailableAt: new Date(
        Date.now() + this.config.otpResendCooldownMs,
      ).toISOString(),
    };
  }

  async verify(email: string, code: string): Promise<VerifySignupOtpResponse> {
    // Each check uses up an attempt first, so parallel guesses can't get more
    // than the allowed number.
    const record = await this.verifications.claimAttempt(
      email,
      this.config.otpMaxAttempts,
    );
    if (!record) {
      if (!(await this.verifications.find(email))) {
        throw new BadRequestException("Request a verification code first.");
      }
      throw tooMany("Too many incorrect attempts. Request a new code.");
    }
    if (record.expiresAt.getTime() <= Date.now()) {
      throw new BadRequestException(
        "This code has expired. Request a new one.",
      );
    }
    if (!sameHash(hashCode(email, code), record.codeHash)) {
      const left = this.config.otpMaxAttempts - record.attempts;
      throw left > 0
        ? new BadRequestException(
            `That code isn't right. ${left} ${left === 1 ? "attempt" : "attempts"} left.`,
          )
        : tooMany("Too many incorrect attempts. Request a new code.");
    }

    const verificationToken = randomBytes(32).toString("base64url");
    const tokenExpiresAt = new Date(
      Date.now() + this.config.verificationTokenTtlMs,
    );
    await this.verifications.markVerified(
      email,
      sha256(verificationToken),
      tokenExpiresAt,
    );
    return { verificationToken, expiresAt: tokenExpiresAt.toISOString() };
  }

  // Throws unless `token` proves this email was verified recently.
  async assertVerified(email: string, token: string): Promise<void> {
    const record = await this.verifications.find(email);
    const valid =
      record?.verifiedAt &&
      record.verificationTokenHash &&
      record.tokenExpiresAt &&
      record.tokenExpiresAt.getTime() > Date.now() &&
      sameHash(sha256(token), record.verificationTokenHash);
    if (!valid) {
      throw new BadRequestException(
        "Please verify your email before creating your account. If you already did, the code may have expired.",
      );
    }
  }

  // A cap on sign-up emails per hour across this server, so a script cycling
  // through addresses can't use up the mail provider's daily quota.
  private sentThisHour: number[] = [];

  private countEmailSent() {
    const hourAgo = Date.now() - 60 * 60 * 1000;
    this.sentThisHour = this.sentThisHour.filter((at) => at > hourAgo);
    if (this.sentThisHour.length >= this.config.otpEmailsPerHour) {
      throw new HttpException(
        "We're sending a lot of codes right now. Please try again in a few minutes.",
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
    this.sentThisHour.push(Date.now());
  }

  complete(email: string) {
    return this.verifications.delete(email);
  }
}
