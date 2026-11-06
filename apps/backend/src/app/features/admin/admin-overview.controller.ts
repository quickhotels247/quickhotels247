import { Controller, Get, UseGuards } from "@nestjs/common";
import type { AdminOverview } from "@quickhotels/types/admin";
import { AdminUsersRepository } from "./admin-users.repository.js";
import { AdminGuard } from "./admin.guard.js";
import { AuditLogRepository } from "./audit-log.repository.js";

@Controller("admin")
@UseGuards(AdminGuard)
export class AdminOverviewController {
  constructor(
    private readonly users: AdminUsersRepository,
    private readonly audit: AuditLogRepository,
  ) {}

  @Get("overview")
  async overview(): Promise<AdminOverview> {
    const [users, recentActivity] = await Promise.all([
      this.users.counts(),
      this.audit.recent(8),
    ]);
    return { users, recentActivity };
  }
}
