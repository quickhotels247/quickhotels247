import { Injectable, NotFoundException } from "@nestjs/common";
import type { BookingDetails, BookingsPage, BookingsTab } from "@quickhotels/types/bookings";
import { hashCheckoutKey } from "../../common/utils/checkout-key.js";
import { todayInIndia } from "../../common/utils/india-dates.js";
import { toDetails, toListItem } from "./booking.mapper.js";
import { BookingsRepository } from "./bookings.repository.js";

const PAGE_SIZE = 10;
const NOT_FOUND = "We couldn't find that booking.";

// My bookings and booking details (spec §4.6–4.8). Customers only ever see
// their own bookings; a guest who checked out without an account opens
// theirs with the checkout key their browser kept.
@Injectable()
export class BookingsService {
  constructor(private readonly bookings: BookingsRepository) {}

  async list(userId: string, tab: BookingsTab, search: string | undefined, page: number): Promise<BookingsPage> {
    // "Upcoming" until the check-out day has passed in India.
    const today = new Date(`${todayInIndia()}T00:00:00Z`);
    const { total, items } = await this.bookings.list(userId, tab, today, search || undefined, page, PAGE_SIZE);
    return { tab, page, pageSize: PAGE_SIZE, total, items: items.map(toListItem) };
  }

  async forUser(reference: string, userId: string): Promise<BookingDetails> {
    const booking = await this.bookings.findForUser(reference.toUpperCase(), userId);
    if (!booking) throw new NotFoundException(NOT_FOUND);
    return toDetails(booking);
  }

  async forCheckout(reference: string, checkoutKey: string): Promise<BookingDetails> {
    const booking = await this.bookings.findForCheckout(reference.toUpperCase(), hashCheckoutKey(checkoutKey));
    if (!booking) throw new NotFoundException(NOT_FOUND);
    return toDetails(booking);
  }
}
