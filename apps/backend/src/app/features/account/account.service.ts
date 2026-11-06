import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import type { AccountSecurity } from "@quickhotels/types/users";
import { ClerkService } from "../auth/clerk.service.js";
import {
  IdentitiesRepository,
  accountKey,
} from "../auth/identities.repository.js";
import { hashPassword, verifyPassword } from "../auth/password-hash.js";
import { checkPasswordPolicy } from "../auth/password-policy.js";
import { SessionService } from "../auth/session.service.js";
import { UsersRepository } from "../auth/users.repository.js";
import type { SetPasswordDto } from "./dto/set-password.dto.js";

// Sign-in methods for the signed-in user: password and connected Google accounts.
@Injectable()
export class AccountService {
  constructor(
    private readonly users: UsersRepository,
    private readonly identities: IdentitiesRepository,
    private readonly clerk: ClerkService,
    private readonly sessions: SessionService,
  ) {}

  async security(userId: string): Promise<AccountSecurity> {
    const user = await this.users.findById(userId);
    if (!user) throw new UnauthorizedException("Your session has expired.");
    return {
      hasPassword: Boolean(user.passwordHash),
      identities: await this.identities.listForUser(userId),
    };
  }

  // Connect the Google account the person just signed in to through Clerk.
  // Works even when its email differs from the QuickHotels24/7 email.
  async connect(userId: string, clerkToken: string): Promise<AccountSecurity> {
    const profile = await this.clerk.profile(clerkToken);
    if (!profile.accounts.length) {
      throw new BadRequestException(
        "We couldn't read that account. Please try again.",
      );
    }

    const owners = await this.identities.owners(profile.accounts);
    for (const account of profile.accounts) {
      const owner = owners.get(accountKey(account));
      if (owner && owner !== userId) {
        throw new ConflictException(
          "This Google account is already connected to a different QuickHotels24/7 account.",
        );
      }
    }
    // Its email belongs to someone else's QuickHotels24/7 account: don't attach it here.
    if (profile.email && profile.emailVerified) {
      const emailOwner = await this.users.findByEmail(profile.email);
      if (emailOwner && emailOwner.id !== userId) {
        throw new ConflictException(
          "That account's email belongs to a different QuickHotels24/7 account. Sign in to that account instead.",
        );
      }
    }

    await this.identities.connect(
      userId,
      profile.clerkUserId,
      profile.accounts,
    );
    return this.security(userId);
  }

  async disconnect(
    userId: string,
    identityId: string,
  ): Promise<AccountSecurity> {
    const current = await this.security(userId);
    if (!current.identities.some((identity) => identity.id === identityId)) {
      throw new NotFoundException("That connection doesn't exist.");
    }
    // Never leave the account without a way to sign in.
    if (!current.hasPassword && current.identities.length === 1) {
      throw new BadRequestException(
        "Set a password or connect another account before disconnecting this one.",
      );
    }
    await this.identities.delete(identityId, userId);
    return this.security(userId);
  }

  // Other sessions (other browsers and devices) are signed out; this one stays.
  async setPassword(
    userId: string,
    sessionToken: string,
    dto: SetPasswordDto,
  ): Promise<AccountSecurity> {
    const user = await this.users.findById(userId);
    if (!user) throw new UnauthorizedException("Your session has expired.");
    if (user.passwordHash) {
      const valid =
        dto.currentPassword !== undefined &&
        (await verifyPassword(dto.currentPassword, user.passwordHash));
      if (!valid)
        throw new BadRequestException("Your current password is incorrect.");
    }
    const policyError = checkPasswordPolicy(dto.password);
    if (policyError) throw new BadRequestException(policyError);
    await this.users.setPassword(userId, await hashPassword(dto.password));
    await this.sessions.revokeOthers(userId, sessionToken);
    return this.security(userId);
  }
}
