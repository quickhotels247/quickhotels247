import { createHash, randomBytes } from "node:crypto";
import { Inject, Injectable } from "@nestjs/common";
import type { AccountSession } from "@quickhotels/types/users";
import { PrismaService } from "../../common/database/prisma.service.js";
import { authConfig, type AuthConfig } from "./auth.config.js";

export const hashToken = (token: string) =>
  createHash("sha256").update(token).digest("hex");

// last_used_at is refreshed at most this often, so reads don't all become writes.
const TOUCH_INTERVAL_MS = 5 * 60 * 1000;

// Opaque bearer tokens kept in auth_tokens. Only a SHA-256 hash is stored.
@Injectable()
export class SessionService {
  constructor(
    private readonly db: PrismaService,
    @Inject(authConfig.KEY) private readonly config: AuthConfig,
  ) {}

  async create(userId: string, device: string | null = null) {
    const token = randomBytes(32).toString("base64url");
    const expiresAt = new Date(Date.now() + this.config.sessionTtlMs);
    await this.db.authToken.create({ data: { userId, tokenHash: hashToken(token), expiresAt, device } });
    return { token, expiresAt };
  }

  // The user the token belongs to, or null if it's unknown, revoked or expired.
  async resolve(token: string): Promise<string | null> {
    const row = await this.db.authToken.findFirst({
      where: {
        tokenHash: hashToken(token),
        revokedAt: null,
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
      select: { id: true, userId: true, lastUsedAt: true },
    });
    if (!row) return null;
    if (Date.now() - row.lastUsedAt.getTime() > TOUCH_INTERVAL_MS) {
      await this.db.authToken.update({ where: { id: row.id }, data: { lastUsedAt: new Date() } });
    }
    return row.userId;
  }

  async hasActiveSession(userId: string): Promise<boolean> {
    const row = await this.db.authToken.findFirst({
      where: { userId, revokedAt: null, OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] },
      select: { id: true },
    });
    return Boolean(row);
  }

  // Signs the user out everywhere except the session in `keepToken`
  // (after a password change, a stolen token must stop working).
  async revokeOthers(userId: string, keepToken: string): Promise<void> {
    await this.db.authToken.updateMany({
      where: { userId, tokenHash: { not: hashToken(keepToken) }, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  // The user's active sessions, most recently used first.
  async list(userId: string, currentToken: string): Promise<AccountSession[]> {
    const rows = await this.db.authToken.findMany({
      where: { userId, revokedAt: null, OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] },
      orderBy: { lastUsedAt: "desc" },
      select: { id: true, device: true, createdAt: true, lastUsedAt: true, tokenHash: true },
    });
    const current = hashToken(currentToken);
    return rows.map((row) => ({
      id: row.id,
      device: row.device,
      createdAt: row.createdAt.toISOString(),
      lastUsedAt: row.lastUsedAt.toISOString(),
      current: row.tokenHash === current,
    }));
  }

  // Signs out one of the user's sessions. False if it isn't theirs or already ended.
  async revokeById(userId: string, id: string): Promise<boolean> {
    const { count } = await this.db.authToken.updateMany({ where: { id, userId, revokedAt: null }, data: { revokedAt: new Date() } });
    return count > 0;
  }

  async revokeAll(userId: string): Promise<void> {
    await this.db.authToken.updateMany({ where: { userId, revokedAt: null }, data: { revokedAt: new Date() } });
  }

  async revoke(token: string): Promise<void> {
    await this.db.authToken.updateMany({
      where: { tokenHash: hashToken(token), revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }
}
