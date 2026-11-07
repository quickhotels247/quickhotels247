import { createHash, randomBytes, randomUUID, timingSafeEqual } from "node:crypto";
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import type {
  AdminAuthResponse,
  AdminProfile,
  AdminSetupStatus,
} from "@quickhotels/types/admin";
import { hashPassword, verifyPassword } from "../auth/password-hash.js";
import { hashToken } from "../auth/session.service.js";
import { adminConfig, type AdminConfig } from "./admin.config.js";
import { AdminsRepository } from "./admins.repository.js";
import { checkAdminPassword } from "./admin-password.js";
import { AuditLogRepository } from "./audit-log.repository.js";
import type { AdminLoginDto } from "./dto/admin-login.dto.js";
import type { ChangeAdminPasswordDto } from "./dto/change-admin-password.dto.js";
import type { AdminSetupDto } from "./dto/new-admin.dto.js";

// Same message for unknown admin and wrong password.
const INVALID_CREDENTIALS = "Email or password is incorrect.";

@Injectable()
export class AdminAuthService {
  // Compared against when the admin doesn't exist, so both paths take the same time.
  private readonly dummyHash = hashPassword(randomUUID());
  // Failed sign-ins per email + address. In memory: resets on restart, which is fine
  // for slowing down guessing on a single server.
  private readonly failures = new Map<string, { count: number; since: number }>();

  constructor(
    private readonly admins: AdminsRepository,
    private readonly audit: AuditLogRepository,
    @Inject(adminConfig.KEY) private readonly config: AdminConfig,
  ) {}

  async login(dto: AdminLoginDto, ip: string): Promise<AdminAuthResponse> {
    const attemptKey = `${dto.email.toLowerCase()}|${ip}`;
    this.assertNotLocked(attemptKey);

    const admin = await this.admins.findByEmail(dto.email);
    const valid = await verifyPassword(
      dto.password,
      admin?.passwordHash ?? (await this.dummyHash),
    );
    if (!admin || !valid) {
      this.recordFailure(attemptKey);
      throw new UnauthorizedException(INVALID_CREDENTIALS);
    }
    this.failures.delete(attemptKey);
    await this.audit.record(admin.id, "admin.login", null, { ip });
    const { passwordHash: _hash, ...profile } = admin;
    return this.startSession(profile);
  }

  // The signup page is open only until the first admin exists; after that,
  // admins are added by other admins.
  async setupStatus(): Promise<AdminSetupStatus> {
    const open = !this.config.production || Boolean(this.config.setupToken);
    return {
      setupNeeded: open && !(await this.admins.exists()),
      tokenRequired: Boolean(this.config.setupToken),
    };
  }

  async setup(dto: AdminSetupDto, ip: string): Promise<AdminAuthResponse> {
    this.assertSetupToken(dto.setupToken);
    const problem = checkAdminPassword(dto.password);
    if (problem) throw new BadRequestException(problem);
    const admin = await this.admins.createFirst({
      name: dto.name,
      email: dto.email,
      passwordHash: await hashPassword(dto.password),
    });
    if (!admin) {
      throw new ConflictException(
        "An admin already exists. Ask them to add you from the Admins page.",
      );
    }
    await this.audit.record(admin.id, "admin.setup", null, { ip });
    return this.startSession(admin);
  }

  // Other sessions of this admin are signed out; this one stays.
  async changePassword(adminId: string, token: string, dto: ChangeAdminPasswordDto) {
    const current = await this.admins.passwordHash(adminId);
    if (!current || !(await verifyPassword(dto.currentPassword, current))) {
      throw new BadRequestException("Your current password isn't right.");
    }
    const problem = checkAdminPassword(dto.newPassword);
    if (problem) throw new BadRequestException(problem);
    if (dto.newPassword === dto.currentPassword) {
      throw new BadRequestException("Choose a password you haven't been using.");
    }
    await this.admins.setPassword(adminId, await hashPassword(dto.newPassword), hashToken(token));
    await this.audit.record(adminId, "admin.password", adminId);
  }

  async me(adminId: string): Promise<AdminProfile> {
    const admin = await this.admins.findById(adminId);
    if (!admin) throw new UnauthorizedException();
    return admin;
  }

  async logout(token: string): Promise<void> {
    await this.admins.revokeToken(hashToken(token));
  }

  // In production, only someone holding ADMIN_SETUP_TOKEN can create the
  // first admin; without it set, sign-up is closed there.
  private assertSetupToken(given: string | undefined) {
    const expected = this.config.setupToken;
    if (!expected) {
      if (this.config.production) {
        throw new ForbiddenException(
          "Admin sign-up is turned off. Create the first admin on the server with db:create-admin.",
        );
      }
      return;
    }
    const digest = (value: string) => createHash("sha256").update(value).digest();
    if (!given || !timingSafeEqual(digest(given), digest(expected))) {
      throw new ForbiddenException("That setup token isn't right.");
    }
  }

  private async startSession(admin: AdminProfile): Promise<AdminAuthResponse> {
    const token = randomBytes(32).toString("base64url");
    const expiresAt = new Date(Date.now() + this.config.sessionTtlMs);
    await this.admins.createToken(admin.id, hashToken(token), expiresAt);
    await this.admins.markLoggedIn(admin.id);
    return { admin, token, expiresAt: expiresAt.toISOString() };
  }

  private assertNotLocked(key: string) {
    const entry = this.failures.get(key);
    if (!entry) return;
    if (Date.now() - entry.since > this.config.loginLockMs) {
      this.failures.delete(key);
      return;
    }
    if (entry.count >= this.config.maxLoginAttempts) {
      throw new HttpException(
        "Too many sign-in attempts. Try again in 15 minutes.",
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }

  private recordFailure(key: string) {
    // Keep the map small when many different emails are tried.
    if (this.failures.size > 10_000) {
      for (const [stale, { since }] of this.failures) {
        if (Date.now() - since > this.config.loginLockMs) this.failures.delete(stale);
      }
    }
    const entry = this.failures.get(key);
    if (entry) entry.count += 1;
    else this.failures.set(key, { count: 1, since: Date.now() });
  }
}
