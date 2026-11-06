import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { authConfig } from "./auth.config.js";
import { AuthController } from "./auth.controller.js";
import { AuthService } from "./auth.service.js";
import { ClerkService } from "./clerk.service.js";
import { AuthGuard } from "./auth.guard.js";
import { EmailVerificationRepository } from "./email-verification.repository.js";
import { IdentitiesRepository } from "./identities.repository.js";
import { OtpService } from "./otp.service.js";
import { SessionService } from "./session.service.js";
import { UsersRepository } from "./users.repository.js";

@Module({
  imports: [ConfigModule.forFeature(authConfig)],
  controllers: [AuthController],
  providers: [
    AuthService,
    SessionService,
    UsersRepository,
    OtpService,
    EmailVerificationRepository,
    ClerkService,
    IdentitiesRepository,
    AuthGuard,
  ],
  // Shared with the account feature (connected accounts, password).
  exports: [
    SessionService,
    UsersRepository,
    IdentitiesRepository,
    ClerkService,
    AuthGuard,
  ],
})
export class AuthModule {}
