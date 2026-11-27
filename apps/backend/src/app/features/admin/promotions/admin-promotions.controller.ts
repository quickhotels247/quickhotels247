import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Post, Put, UseGuards } from "@nestjs/common";
import { AdminGuard, CurrentAdminId, RequirePermission } from "../admin.guard.js";
import { AdminPromotionsService } from "./admin-promotions.service.js";
import { PromotionDto } from "./dto/promotion.dto.js";

// Automatic discounts on all hotels. Each change returns the full list.
@Controller("admin/promotions")
@UseGuards(AdminGuard)
@RequirePermission("pricing")
export class AdminPromotionsController {
  constructor(private readonly promotions: AdminPromotionsService) {}

  @Get()
  list() {
    return this.promotions.list();
  }

  @Post()
  create(@Body() dto: PromotionDto, @CurrentAdminId() adminId: string) {
    return this.promotions.create(dto, adminId);
  }

  @Put(":id")
  update(@Param("id", new ParseUUIDPipe()) id: string, @Body() dto: PromotionDto, @CurrentAdminId() adminId: string) {
    return this.promotions.update(id, dto, adminId);
  }

  @Delete(":id")
  remove(@Param("id", new ParseUUIDPipe()) id: string, @CurrentAdminId() adminId: string) {
    return this.promotions.remove(id, adminId);
  }
}
