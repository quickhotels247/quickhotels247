import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import type { AdminAccount, AdminRole } from "@quickhotels/types/admin";
import { hashPassword } from "../auth/password-hash.js";
import { checkAdminPassword } from "./admin-password.js";
import { AdminsRepository } from "./admins.repository.js";
import { AuditLogRepository } from "./audit-log.repository.js";
import type { AddAdminDto } from "./dto/new-admin.dto.js";

// The admin team (super admins): add people with a role, change roles, remove.
// Nobody changes or removes themselves, and one super admin always remains.
@Injectable()
export class AdminAdminsService {
  constructor(
    private readonly admins: AdminsRepository,
    private readonly audit: AuditLogRepository,
  ) {}

  list(): Promise<AdminAccount[]> {
    return this.admins.list();
  }

  async create(dto: AddAdminDto, adminId: string): Promise<AdminAccount> {
    const problem = checkAdminPassword(dto.password);
    if (problem) throw new BadRequestException(problem);
    const created = await this.admins.create({
      name: dto.name,
      email: dto.email,
      passwordHash: await hashPassword(dto.password),
      role: dto.role,
    });
    if (!created) throw new ConflictException("An admin with this email already exists.");
    await this.audit.record(adminId, "admin.create", created.id, {
      name: created.name,
      email: created.email,
      role: created.role,
    });
    return created;
  }

  async setRole(id: string, role: AdminRole, adminId: string): Promise<AdminAccount[]> {
    if (id === adminId) throw new ForbiddenException("You can't change your own role. Ask another super admin.");
    const target = await this.admins.findById(id);
    if (!target) throw new NotFoundException("That admin no longer exists.");
    if (target.role === "SUPER_ADMIN" && role !== "SUPER_ADMIN") await this.keepOneSuperAdmin();
    await this.admins.setRole(id, role);
    await this.audit.record(adminId, "admin.role", id, { name: target.name, from: target.role, to: role });
    return this.admins.list();
  }

  async remove(id: string, adminId: string): Promise<AdminAccount[]> {
    if (id === adminId) throw new ForbiddenException("You can't remove yourself. Ask another super admin.");
    const target = await this.admins.findById(id);
    if (!target) throw new NotFoundException("That admin no longer exists.");
    if (target.role === "SUPER_ADMIN") await this.keepOneSuperAdmin();
    await this.admins.remove(id);
    await this.audit.record(adminId, "admin.remove", id, { name: target.name, email: target.email, role: target.role });
    return this.admins.list();
  }

  private async keepOneSuperAdmin() {
    if ((await this.admins.countSuperAdmins()) <= 1) throw new ConflictException("Keep at least one super admin.");
  }
}
