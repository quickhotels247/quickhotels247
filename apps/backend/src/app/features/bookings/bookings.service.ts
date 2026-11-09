import { Injectable, NotFoundException } from "@nestjs/common";
import type { BookingDetails, BookingsPage, BookingsTab } from "@quickhotels/types/bookings";
import { bookingLinkValid } from "../../common/utils/booking-links.js";
import { hashCheckoutKey } from "../../common/utils/checkout-key.js";
import { CheckoutRepository } from "../checkout/checkout.repository.js";
import { HotelBookingService } from "../checkout/booking/hotel-booking.service.js";
import { todayInIndia } from "../../common/utils/india-dates.js";
import { toDetails, toListItem } from "./booking.mapper.js";
import { BookingsRepository, type BookingWithDetails } from "./bookings.repository.js";

const PAGE_SIZE = 10;
const NOT_FOUND = "We couldn't find that booking.";

// My bookings and booking details (spec §4.6–4.8). Customers only ever see
// their own bookings; a guest who checked out without an account opens
// theirs with the checkout key their browser kept.
@Injectable()
export class BookingsService {
  constructor(
    private readonly bookings: BookingsRepository,
    private readonly checkouts: CheckoutRepository,
    private readonly hotelBooking: HotelBookingService,
  ) {}

  async list(userId: string, tab: BookingsTab, search: string | undefined, page: number): Promise<BookingsPage> {
    // "Upcoming" until the check-out day has passed in India.
    const today = new Date(`${todayInIndia()}T00:00:00Z`);
    const { total, items } = await this.bookings.list(userId, tab, today, search || undefined, page, PAGE_SIZE);
    return { tab, page, pageSize: PAGE_SIZE, total, items: items.map(toListItem) };
  }

  async forUser(reference: string, userId: string): Promise<BookingDetails> {
    const booking = await this.bookings.findForUser(reference.toUpperCase(), userId);
    if (!booking) throw new NotFoundException(NOT_FOUND);
    return this.details(booking);
  }

  async forCheckout(reference: string, checkoutKey: string): Promise<BookingDetails> {
    const booking = await this.bookings.findForCheckout(reference.toUpperCase(), hashCheckoutKey(checkoutKey));
    if (!booking) throw new NotFoundException(NOT_FOUND);
    return this.details(booking);
  }

  // The private link from the booking emails (any device, no sign-in).
  async forLink(reference: string, token: string | undefined): Promise<BookingDetails> {
    const booking = await this.bookings.findByReference(reference.toUpperCase());
    if (!booking || !bookingLinkValid("hotel", booking.id, token)) throw new NotFoundException(NOT_FOUND);
    return this.details(booking);
  }

  // Still waiting on the hotel: make sure it's being checked.
  private async details(booking: BookingWithDetails): Promise<BookingDetails> {
    if (booking.attemptId && (booking.status === "PAYMENT_PENDING" || booking.status === "SUPPLIER_BOOKING_PENDING")) {
      const checkout = await this.checkouts.find(booking.attemptId);
      if (checkout) this.hotelBooking.recover(checkout);
    }
    return toDetails(booking);
  }
}
