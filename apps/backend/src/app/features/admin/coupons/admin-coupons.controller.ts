import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Post, Put, UseGuards } from "@nestjs/common";
import { AdminGuard, CurrentAdminId } from "../admin.guard.js";
import { AdminCouponsService } from "./admin-coupons.service.js";
import { CouponDto } from "./dto/coupon.dto.js";

// Coupon codes. Each change returns the full, updated list.
@Controller("admin/coupons")
@UseGuards(AdminGuard)
export class AdminCouponsController {
  constructor(private readonly coupons: AdminCouponsService) {}

  @Get()
  list() {
    return this.coupons.list();
  }

  @Post()
  create(@Body() dto: CouponDto, @CurrentAdminId() adminId: string) {
    return this.coupons.create(dto, adminId);
  }

  @Put(":id")
  update(@Param("id", new ParseUUIDPipe()) id: string, @Body() dto: CouponDto, @CurrentAdminId() adminId: string) {
    return this.coupons.update(id, dto, adminId);
  }

  @Delete(":id")
  remove(@Param("id", new ParseUUIDPipe()) id: string, @CurrentAdminId() adminId: string) {
    return this.coupons.remove(id, adminId);
  }
}
