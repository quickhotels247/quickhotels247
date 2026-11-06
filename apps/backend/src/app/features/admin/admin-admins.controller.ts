import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import { AdminAdminsService } from "./admin-admins.service.js";
import { AdminGuard, CurrentAdminId } from "./admin.guard.js";
import { NewAdminDto } from "./dto/new-admin.dto.js";

@Controller("admin/admins")
@UseGuards(AdminGuard)
export class AdminAdminsController {
  constructor(private readonly admins: AdminAdminsService) {}

  @Get()
  list() {
    return this.admins.list();
  }

  @Post()
  create(@Body() dto: NewAdminDto, @CurrentAdminId() adminId: string) {
    return this.admins.create(dto, adminId);
  }
}
