import { Injectable, NotFoundException } from "@nestjs/common";
import type { AdminUserList, AdminUserRow } from "@quickhotels/types/admin";
import { AdminUsersRepository } from "./admin-users.repository.js";

@Injectable()
export class AdminUsersService {
  constructor(private readonly users: AdminUsersRepository) {}

  async list(search: string, page: number, pageSize: number): Promise<AdminUserList> {
    const { items, total } = await this.users.list(search, page, pageSize);
    return { items, total, page, pageSize };
  }

  async detail(userId: string): Promise<AdminUserRow> {
    const user = await this.users.find(userId);
    if (!user) throw new NotFoundException("User not found.");
    return user;
  }
}
