import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Post, Put, UseGuards } from "@nestjs/common";
import { AdminGuard, CurrentAdminId } from "../admin.guard.js";
import { AdminPricingService } from "./admin-pricing.service.js";
import { PricingRuleDto } from "./dto/pricing-rule.dto.js";

// Markup rules. Each change returns the full, updated list.
@Controller("admin/pricing-rules")
@UseGuards(AdminGuard)
export class AdminPricingController {
  constructor(private readonly pricing: AdminPricingService) {}

  @Get()
  list() {
    return this.pricing.list();
  }

  @Post()
  create(@Body() dto: PricingRuleDto, @CurrentAdminId() adminId: string) {
    return this.pricing.create(dto, adminId);
  }

  @Put(":id")
  update(@Param("id", new ParseUUIDPipe()) id: string, @Body() dto: PricingRuleDto, @CurrentAdminId() adminId: string) {
    return this.pricing.update(id, dto, adminId);
  }

  @Delete(":id")
  remove(@Param("id", new ParseUUIDPipe()) id: string, @CurrentAdminId() adminId: string) {
    return this.pricing.remove(id, adminId);
  }
}
