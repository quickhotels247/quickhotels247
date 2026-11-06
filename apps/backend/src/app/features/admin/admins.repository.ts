import { Injectable } from "@nestjs/common";
import type { AdminAccount, AdminProfile } from "@quickhotels/types/admin";
import { PrismaService } from "../../common/database/prisma.service.js";
import { Prisma } from "../../../generated/prisma/client.js";

export interface AdminWithPassword extends AdminProfile {
  passwordHash: string;
}

export interface NewAdmin {
  name: string;
  email: string;
  passwordHash: string;
}

// Serialises "create the first admin" so two people can't both become it.
const FIRST_ADMIN_LOCK = 4_242_001;

const accountFields = { id: true, name: true, email: true, createdAt: true, lastLoginAt: true } as const;

const toAccount = (row: { id: string; name: string; email: string; createdAt: Date; lastLoginAt: Date | null }): AdminAccount => ({
  id: row.id,
  name: row.name,
  email: row.email,
  createdAt: row.createdAt.toISOString(),
  lastLoginAt: row.lastLoginAt?.toISOString() ?? null,
});

// A duplicate email (any case) trips the unique index on lower(email).
const isUniqueViolation = (error: unknown) =>
  (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") ||
  (error as { cause?: { originalCode?: string } })?.cause?.originalCode === "23505";

// Admin accounts and their sessions. Kept apart from users and auth_tokens.
@Injectable()
export class AdminsRepository {
  constructor(private readonly db: PrismaService) {}

  async findByEmail(email: string): Promise<AdminWithPassword | null> {
    const rows = await this.db.$queryRaw<{ id: string }[]>`
      SELECT id FROM admin_users WHERE lower(email) = lower(${email}) LIMIT 1`;
    if (!rows[0]) return null;
    const row = await this.db.adminUser.findUnique({
      where: { id: rows[0].id },
      select: { id: true, name: true, email: true, passwordHash: true },
    });
    return row;
  }

  async exists(): Promise<boolean> {
    return (await this.db.adminUser.count({ take: 1 })) > 0;
  }

  // Creates the first admin, or returns null if one already exists.
  async createFirst(admin: NewAdmin): Promise<AdminProfile | null> {
    return this.db.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(${FIRST_ADMIN_LOCK})`;
      if (await tx.adminUser.count({ take: 1 })) return null;
      return tx.adminUser.create({ data: admin, select: { id: true, name: true, email: true } });
    });
  }

  // Returns null if an admin already has this email (any case).
  async create(admin: NewAdmin): Promise<AdminAccount | null> {
    try {
      return toAccount(await this.db.adminUser.create({ data: admin, select: accountFields }));
    } catch (error) {
      if (isUniqueViolation(error)) return null;
      throw error;
    }
  }

  async list(): Promise<AdminAccount[]> {
    const rows = await this.db.adminUser.findMany({ select: accountFields, orderBy: [{ createdAt: "asc" }, { email: "asc" }] });
    return rows.map(toAccount);
  }

  async passwordHash(id: string): Promise<string | null> {
    const row = await this.db.adminUser.findUnique({ where: { id }, select: { passwordHash: true } });
    return row?.passwordHash ?? null;
  }

  // New password; every other session of this admin is signed out.
  async setPassword(id: string, passwordHash: string, keepTokenHash: string) {
    await this.db.$transaction([
      this.db.adminUser.update({ where: { id }, data: { passwordHash } }),
      this.db.adminToken.updateMany({
        where: { adminId: id, tokenHash: { not: keepTokenHash }, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    ]);
  }

  findById(id: string): Promise<AdminProfile | null> {
    return this.db.adminUser.findUnique({ where: { id }, select: { id: true, name: true, email: true } });
  }

  async markLoggedIn(id: string): Promise<void> {
    await this.db.adminUser.update({ where: { id }, data: { lastLoginAt: new Date() } });
  }

  async createToken(adminId: string, tokenHash: string, expiresAt: Date): Promise<void> {
    await this.db.adminToken.create({ data: { adminId, tokenHash, expiresAt } });
  }

  // The admin the token belongs to, or null if it's unknown, revoked or expired.
  // One atomic UPDATE … RETURNING, as before.
  async resolveToken(tokenHash: string): Promise<string | null> {
    const rows = await this.db.$queryRaw<{ admin_id: string }[]>`
      UPDATE admin_tokens SET last_used_at = now()
      WHERE token_hash = ${tokenHash} AND revoked_at IS NULL AND expires_at > now()
      RETURNING admin_id`;
    return rows[0]?.admin_id ?? null;
  }

  async revokeToken(tokenHash: string): Promise<void> {
    await this.db.adminToken.updateMany({ where: { tokenHash, revokedAt: null }, data: { revokedAt: new Date() } });
  }
}
