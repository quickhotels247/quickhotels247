import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Post, Put, UseGuards } from "@nestjs/common";
import { AdminGuard, RequirePermission, CurrentAdminId } from "../admin.guard.js";
import { AdminCouponsService } from "./admin-coupons.service.js";
import { CouponActionDto } from "./dto/coupon-action.dto.js";
import { CouponDto } from "./dto/coupon.dto.js";

// Coupon codes. Each change returns the full, updated list.
@Controller("admin/coupons")
@UseGuards(AdminGuard)
@RequirePermission("coupons")
export class AdminCouponsController {
  constructor(private readonly coupons: AdminCouponsService) {}

  @Get()
  list() {
    return this.coupons.list();
  }

  // Who used it, on which bookings, and the discount given.
  @Get(":id/report")
  report(@Param("id", new ParseUUIDPipe()) id: string) {
    return this.coupons.report(id);
  }

  @Post(":id/action")
  act(@Param("id", new ParseUUIDPipe()) id: string, @Body() dto: CouponActionDto, @CurrentAdminId() adminId: string) {
    return this.coupons.act(id, dto.action, adminId);
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
