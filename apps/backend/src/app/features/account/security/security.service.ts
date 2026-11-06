import { BadRequestException, ConflictException, Injectable, NotFoundException, UnauthorizedException } from "@nestjs/common";
import type { AccountSession } from "@quickhotels/types/users";
import { ClerkService } from "../../auth/clerk.service.js";
import { SessionService } from "../../auth/session.service.js";
import { UsersRepository } from "../../auth/users.repository.js";
import { AccountDeletionRepository } from "./account-deletion.repository.js";

// Signed-in devices and closing the account.
@Injectable()
export class SecurityService {
  constructor(
    private readonly sessions: SessionService,
    private readonly users: UsersRepository,
    private readonly clerk: ClerkService,
    private readonly deletion: AccountDeletionRepository,
  ) {}

  sessionsFor(userId: string, token: string): Promise<AccountSession[]> {
    return this.sessions.list(userId, token);
  }

  async signOut(userId: string, sessionId: string): Promise<void> {
    if (!(await this.sessions.revokeById(userId, sessionId))) throw new NotFoundException("This device is already signed out.");
  }

  signOutOthers(userId: string, token: string): Promise<void> {
    return this.sessions.revokeOthers(userId, token);
  }

  async deleteAccount(userId: string, confirmEmail: string): Promise<void> {
    const user = await this.users.findById(userId);
    if (!user) throw new UnauthorizedException("Your session has expired.");
    if (confirmEmail.trim().toLowerCase() !== user.email.toLowerCase())
      throw new BadRequestException("Type your account email exactly to confirm.");
    if (await this.deletion.hasOpenBookings(userId))
      throw new ConflictException("You have an upcoming or in-progress booking. Please wait until it's completed or cancelled, or contact support.");
    await this.deletion.anonymise(userId);
    if (user.clerkUserId) await this.clerk.deleteUser(user.clerkUserId);
  }
}
