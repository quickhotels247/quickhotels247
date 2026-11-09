import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Query, UseGuards } from "@nestjs/common";
import { AdminGuard, CurrentAdminId, RequirePermission } from "../admin.guard.js";
import { AdminBookingsRepository } from "./admin-bookings.repository.js";
import { AdminBookingsService } from "./admin-bookings.service.js";
import { FlightBookingListQueryDto, PaymentListQueryDto, RefundDto } from "./dto/admin-bookings.dto.js";

@Controller("admin")
@UseGuards(AdminGuard)
export class AdminBookingsController {
  constructor(
    private readonly bookings: AdminBookingsService,
    private readonly repository: AdminBookingsRepository,
  ) {}

  @Get("bookings/flights")
  @RequirePermission("bookings")
  flights(@Query() query: FlightBookingListQueryDto) {
    return this.repository.flights(query.status, query.q || undefined, query.page);
  }

  @Get("bookings/flights/:id")
  @RequirePermission("bookings")
  flight(@Param("id", new ParseUUIDPipe()) id: string) {
    return this.bookings.flight(id);
  }

  @Post("bookings/flights/:id/recheck")
  @RequirePermission("bookings")
  recheck(@Param("id", new ParseUUIDPipe()) id: string, @CurrentAdminId() adminId: string) {
    return this.bookings.recheck(id, adminId);
  }

  @Post("bookings/flights/:id/refund")
  @RequirePermission("refunds")
  refund(@Param("id", new ParseUUIDPipe()) id: string, @Body() dto: RefundDto, @CurrentAdminId() adminId: string) {
    return this.bookings.refund(id, dto.amount ?? null, dto.reason, adminId);
  }

  @Get("payments")
  @RequirePermission("bookings")
  payments(@Query() query: PaymentListQueryDto) {
    return this.repository.payments(query.status, query.q || undefined, query.page);
  }
}
