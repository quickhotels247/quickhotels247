import { Injectable } from "@nestjs/common";
import type { Identity, IdentityProvider } from "@quickhotels/types/users";
import { PrismaService } from "../../common/database/prisma.service.js";

// A Google account as reported by Clerk.
export interface ProviderAccount {
  provider: IdentityProvider;
  providerUserId: string;
  email: string | null;
}

@Injectable()
export class IdentitiesRepository {
  constructor(private readonly db: PrismaService) {}

  // Which user (if any) already owns each of these provider accounts.
  async owners(accounts: ProviderAccount[]): Promise<Map<string, string>> {
    if (!accounts.length) return new Map();
    const rows = await this.db.userIdentity.findMany({
      where: { OR: accounts.map((a) => ({ provider: a.provider, providerUserId: a.providerUserId })) },
      select: { provider: true, providerUserId: true, userId: true },
    });
    return new Map(rows.map((row) => [`${row.provider}:${row.providerUserId}`, row.userId]));
  }

  // Connects accounts to a user; ones already connected are left as they are.
  async connect(userId: string, clerkUserId: string, accounts: ProviderAccount[]) {
    if (!accounts.length) return;
    await this.db.userIdentity.createMany({
      data: accounts.map((account) => ({
        userId,
        provider: account.provider,
        providerUserId: account.providerUserId,
        clerkUserId,
        email: account.email,
      })),
      skipDuplicates: true,
    });
  }

  async listForUser(userId: string): Promise<Identity[]> {
    const rows = await this.db.userIdentity.findMany({ where: { userId }, orderBy: { createdAt: "asc" } });
    return rows.map((row) => ({
      id: row.id,
      provider: row.provider as IdentityProvider,
      email: row.email,
      createdAt: row.createdAt.toISOString(),
    }));
  }

  async delete(id: string, userId: string): Promise<boolean> {
    const { count } = await this.db.userIdentity.deleteMany({ where: { id, userId } });
    return count > 0;
  }
}

export const accountKey = (account: ProviderAccount) =>
  `${account.provider}:${account.providerUserId}`;
