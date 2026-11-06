import { Injectable } from "@nestjs/common";
import type { AdminUserRow } from "@quickhotels/types/admin";
import type { SignedInWith } from "@quickhotels/types/users";
import { PrismaService } from "../../common/database/prisma.service.js";
import { Prisma } from "../../../generated/prisma/client.js";

interface Row {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  username: string;
  signed_in_with: SignedInWith;
  created_at: Date;
  last_active_at: Date | null;
  total: bigint;
}

// Users as the admin Users page lists them, with when they were last active.
const SELECT = Prisma.sql`
  SELECT u.id, u.email, u.first_name, u.last_name, u.username, u.signed_in_with,
         u.created_at,
         (SELECT max(t.last_used_at) FROM auth_tokens t WHERE t.user_id = u.id) AS last_active_at,
         count(*) OVER () AS total
  FROM users u`;

// Searched text is matched literally: % and _ aren't wildcards.
const likePattern = (text: string) => `%${text.replace(/[\\%_]/g, "\\$&")}%`;

const toRow = (row: Row): AdminUserRow => ({
  id: row.id,
  email: row.email,
  name: `${row.first_name} ${row.last_name}`.trim(),
  username: row.username,
  signedInWith: row.signed_in_with,
  createdAt: row.created_at.toISOString(),
  lastActiveAt: row.last_active_at?.toISOString() ?? null,
});

@Injectable()
export class AdminUsersRepository {
  constructor(private readonly db: PrismaService) {}

  // Newest first; search matches email, username or full name.
  async list(search: string, page: number, pageSize: number): Promise<{ items: AdminUserRow[]; total: number }> {
    const pattern = likePattern(search);
    const rows = await this.db.$queryRaw<Row[]>`
      ${SELECT}
      WHERE ${search} = ''
         OR u.email ILIKE ${pattern} OR u.username ILIKE ${pattern}
         OR (u.first_name || ' ' || u.last_name) ILIKE ${pattern}
      ORDER BY u.created_at DESC, u.id
      LIMIT ${pageSize} OFFSET ${(page - 1) * pageSize}`;
    return { items: rows.map(toRow), total: Number(rows[0]?.total ?? 0) };
  }

  async find(userId: string): Promise<AdminUserRow | null> {
    const rows = await this.db.$queryRaw<Row[]>`${SELECT} WHERE u.id = ${userId}::uuid`;
    return rows[0] ? toRow(rows[0]) : null;
  }

  async counts(): Promise<{ total: number; newLast7Days: number }> {
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const [total, newLast7Days] = await Promise.all([
      this.db.user.count(),
      this.db.user.count({ where: { createdAt: { gt: weekAgo } } }),
    ]);
    return { total, newLast7Days };
  }
}
