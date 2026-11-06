import { BadRequestException, ConflictException, Injectable } from "@nestjs/common";
import type { AdminAccount } from "@quickhotels/types/admin";
import { hashPassword } from "../auth/password-hash.js";
import { checkAdminPassword } from "./admin-password.js";
import { AdminsRepository } from "./admins.repository.js";
import { AuditLogRepository } from "./audit-log.repository.js";
import type { NewAdminDto } from "./dto/new-admin.dto.js";

// The admin team: only an existing admin can add another.
@Injectable()
export class AdminAdminsService {
  constructor(
    private readonly admins: AdminsRepository,
    private readonly audit: AuditLogRepository,
  ) {}

  list(): Promise<AdminAccount[]> {
    return this.admins.list();
  }

  async create(dto: NewAdminDto, adminId: string): Promise<AdminAccount> {
    const problem = checkAdminPassword(dto.password);
    if (problem) throw new BadRequestException(problem);
    const created = await this.admins.create({
      name: dto.name,
      email: dto.email,
      passwordHash: await hashPassword(dto.password),
    });
    if (!created) throw new ConflictException("An admin with this email already exists.");
    await this.audit.record(adminId, "admin.create", created.id, {
      name: created.name,
      email: created.email,
    });
    return created;
  }
}
