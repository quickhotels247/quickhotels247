import { Body, Controller, Get, Put, UseGuards } from "@nestjs/common";
import { PricingService } from "../../../pricing/pricing.service.js";
import { CompanySettingsService } from "../../../settings/company-settings.service.js";
import { AdminGuard, CurrentAdminId, RequirePermission } from "../admin.guard.js";
import { AuditLogRepository } from "../audit-log.repository.js";
import { MarginGstDto } from "./dto/margin-gst.dto.js";

// GST on our hotel margin (agent model): admin → Pricing & markup.
@Controller("admin/pricing-settings")
@UseGuards(AdminGuard)
@RequirePermission("pricing")
export class AdminPricingSettingsController {
  constructor(
    private readonly settings: CompanySettingsService,
    private readonly pricing: PricingService,
    private readonly audit: AuditLogRepository,
  ) {}

  @Get("margin-gst")
  async get() {
    return { percent: await this.settings.marginGstPercent() };
  }

  @Put("margin-gst")
  async save(@Body() dto: MarginGstDto, @CurrentAdminId() adminId: string) {
    const percent = await this.settings.saveMarginGstPercent(dto.percent, adminId);
    this.pricing.invalidate();
    await this.audit.record(adminId, "pricing.margin_gst", null, { percent });
    return { percent };
  }
}
