import { Injectable, NotFoundException } from "@nestjs/common";
import type { AdminFlightBooking } from "@quickhotels/types/admin";
import { FlightBookingService } from "../../flights/booking/flight-booking.service.js";
import { PaymentsService } from "../../payments/payments.service.js";
import { AuditLogRepository } from "../audit-log.repository.js";
import { AdminBookingsRepository } from "./admin-bookings.repository.js";

@Injectable()
export class AdminBookingsService {
  constructor(
    private readonly bookings: AdminBookingsRepository,
    private readonly flights: FlightBookingService,
    private readonly payments: PaymentsService,
    private readonly audit: AuditLogRepository,
  ) {}

  async flight(id: string): Promise<AdminFlightBooking> {
    const booking = await this.bookings.flight(id);
    if (!booking) throw new NotFoundException("That booking was not found.");
    return booking;
  }

  // Ask TripJack again: moves a stuck booking on, or refreshes the tickets.
  async recheck(id: string, adminId: string): Promise<{ supplierStatus: string; booking: AdminFlightBooking }> {
    await this.flight(id);
    const supplierStatus = await this.flights.adminRecheck(id);
    await this.audit.record(adminId, "booking.recheck", id, { supplierStatus });
    return { supplierStatus, booking: await this.flight(id) };
  }

  // Money back to the customer (full or part). It doesn't cancel any ticket
  // with the airline: that's a separate step with TripJack.
  async refund(id: string, amount: number | null, reason: string, adminId: string): Promise<AdminFlightBooking> {
    await this.flight(id);
    const result = await this.payments.refund({ flightCheckoutId: id }, amount, reason, adminId);
    await this.audit.record(adminId, "booking.refund", id, { amount: result.amount, status: result.status, reason });
    return this.flight(id);
  }
}
