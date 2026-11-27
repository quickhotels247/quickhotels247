import { Body, Controller, Delete, Get, Put, UseGuards } from "@nestjs/common";
import { CompanySettingsService } from "../../../settings/company-settings.service.js";
import { AdminGuard, CurrentAdminId, RequirePermission } from "../admin.guard.js";
import { AuditLogRepository } from "../audit-log.repository.js";
import { CompanyGstDto } from "./dto/company-gst.dto.js";

// Our company's details used in bookings (super admins).
@Controller("admin/company")
@UseGuards(AdminGuard)
@RequirePermission("company")
export class AdminCompanyController {
  constructor(
    private readonly settings: CompanySettingsService,
    private readonly audit: AuditLogRepository,
  ) {}

  @Get("gst")
  gst() {
    return this.settings.gstSetting();
  }

  @Put("gst")
  async saveGst(@Body() dto: CompanyGstDto, @CurrentAdminId() adminId: string) {
    const saved = await this.settings.saveGst(dto, adminId);
    await this.audit.record(adminId, "company.gst.update", null, { gstNumber: dto.gstNumber, registeredName: dto.registeredName });
    return saved;
  }

  @Delete("gst")
  async clearGst(@CurrentAdminId() adminId: string) {
    const cleared = await this.settings.clearGst();
    await this.audit.record(adminId, "company.gst.clear", null);
    return cleared;
  }
}
