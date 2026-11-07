import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Post, Put, UseGuards } from "@nestjs/common";
import { AdminAdminsService } from "./admin-admins.service.js";
import { AdminGuard, CurrentAdminId, RequirePermission } from "./admin.guard.js";
import { AddAdminDto, UpdateAdminDto } from "./dto/new-admin.dto.js";

@Controller("admin/admins")
@UseGuards(AdminGuard)
@RequirePermission("team")
export class AdminAdminsController {
  constructor(private readonly admins: AdminAdminsService) {}

  @Get()
  list() {
    return this.admins.list();
  }

  @Post()
  create(@Body() dto: AddAdminDto, @CurrentAdminId() adminId: string) {
    return this.admins.create(dto, adminId);
  }

  @Put(":id/role")
  setRole(@Param("id", new ParseUUIDPipe()) id: string, @Body() dto: UpdateAdminDto, @CurrentAdminId() adminId: string) {
    return this.admins.setRole(id, dto.role, adminId);
  }

  @Delete(":id")
  remove(@Param("id", new ParseUUIDPipe()) id: string, @CurrentAdminId() adminId: string) {
    return this.admins.remove(id, adminId);
  }
}
