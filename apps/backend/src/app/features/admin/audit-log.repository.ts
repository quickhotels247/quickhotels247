import { Injectable, Logger } from "@nestjs/common";
import type { AuditEntry } from "@quickhotels/types/admin";
import { PrismaService } from "../../common/database/prisma.service.js";
import type { Prisma } from "../../../generated/prisma/client.js";

// Who changed what on the admin dashboard. Never given key material.
@Injectable()
export class AuditLogRepository {
  private readonly logger = new Logger(AuditLogRepository.name);

  constructor(private readonly db: PrismaService) {}

  // A failed audit write must not undo the change it describes.
  async record(
    adminId: string,
    action: string,
    target: string | null,
    details: Record<string, unknown> = {},
  ): Promise<void> {
    try {
      await this.db.adminAuditLog.create({
        data: { adminId, action, target, details: details as Prisma.InputJsonObject },
      });
    } catch (error) {
      this.logger.error(`Couldn't record ${action}: ${(error as Error).message}`);
    }
  }

  async recent(limit: number): Promise<AuditEntry[]> {
    const rows = await this.db.adminAuditLog.findMany({
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: limit,
      include: { admin: { select: { name: true } } },
    });
    return rows.map((row) => ({
      id: String(row.id),
      adminName: row.admin?.name ?? null,
      action: row.action,
      target: row.target,
      details: row.details as Record<string, unknown>,
      createdAt: row.createdAt.toISOString(),
    }));
  }
}
