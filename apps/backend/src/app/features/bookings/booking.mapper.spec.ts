import { describe, expect, it } from "vitest";
import type { BookingWithDetails } from "./bookings.repository.js";
import { toDetails } from "./booking.mapper.js";

const at = (iso: string) => new Date(iso);
const decimal = (value: number) => ({ toString: () => String(value) });

function booking(changes: Partial<BookingWithDetails> = {}): BookingWithDetails {
  return {
    id: "b1", reference: "QH-7K2M9P", userId: "u1", attemptId: "a1", supplier: "tripjack", supplierBookingReference: "TJ1",
    supplierConfirmation: null, hotelId: "h1", status: "SUPPLIER_BOOKING_PENDING", checkIn: at("2026-12-20"), checkOut: at("2026-12-23"),
    currency: "INR", totalAmount: decimal(12345.5), contactEmail: "asha@example.com", contactPhone: "+91 9876543210", specialRequests: null,
    termsVersion: "2026-11-05", confirmedAt: null, cancelledAt: null, createdAt: at("2026-11-05T10:00:00Z"), updatedAt: at("2026-11-05T10:00:00Z"),
    hotel: { id: "h1", name: "Sea Breeze", city: "Goa", address: "Baga", starRating: decimal(4), latitude: decimal(15.5), longitude: decimal(73.8), heroImageUrl: null },
    rooms: [
      {
        id: "r1", bookingId: "b1", roomName: "Deluxe", mealPlan: "Breakfast", adults: 2, childAges: [7], rateSnapshot: {},
        cancellationPolicy: { refundable: true, freeCancellationUntil: "2026-12-18T23:59:59", charges: [{ from: "2026-12-18T23:59:59", to: "2026-12-20T00:00:00", amount: { amount: 12345.5, currency: "INR" } }, { nonsense: true }] },
        guests: [{ id: "g1", bookingId: "b1", roomId: "r1", title: "Ms", firstName: "Asha", lastName: "Rao", type: "ADULT", age: null, isLead: true }],
      },
    ],
    priceSnapshot: null,
    payments: [],
    cancellations: [],
    statusHistory: [
      { id: 1n, attemptId: null, bookingId: "b1", fromStatus: null, toStatus: "PAYMENT_PENDING", source: "payment", reason: null, actorAdminId: null, createdAt: at("2026-11-05T10:00:00Z") },
      { id: 2n, attemptId: null, bookingId: "b1", fromStatus: "PAYMENT_PENDING", toStatus: "SUPPLIER_BOOKING_PENDING", source: "payment", reason: null, actorAdminId: null, createdAt: at("2026-11-05T10:01:00Z") },
    ],
    ...changes,
  } as unknown as BookingWithDetails;
}

describe("toDetails", () => {
  it("keeps a booking pending until the supplier confirms it", () => {
    const details = toDetails(booking());
    expect(details.status).toBe("pending");
    expect(details).toMatchObject({ nights: 3, rooms: 1, adults: 2, children: 1, total: { amount: 12345.5, currency: "INR" } });
    // Two internal steps, one customer-facing "pending" entry.
    expect(details.timeline).toEqual([{ status: "pending", at: "2026-11-05T10:00:00.000Z" }]);
    expect(toDetails(booking({ status: "CONFIRMED" } as Partial<BookingWithDetails>)).status).toBe("confirmed");
  });

  it("reads the cancellation policy saved at booking, skipping bad entries", () => {
    expect(toDetails(booking()).cancellationPolicy).toEqual({
      refundable: true,
      freeCancellationUntil: "2026-12-18T23:59:59",
      charges: [{ from: "2026-12-18T23:59:59", to: "2026-12-20T00:00:00", amount: { amount: 12345.5, currency: "INR" } }],
    });
  });

  it("maps guests and drops unknown titles", () => {
    const rooms = booking().rooms;
    rooms[0]!.guests[0]!.title = "Dr";
    expect(toDetails(booking({ rooms } as Partial<BookingWithDetails>)).roomsBooked[0]!.guests[0]).toEqual({
      title: null, firstName: "Asha", lastName: "Rao", child: false, lead: true,
    });
  });
});
