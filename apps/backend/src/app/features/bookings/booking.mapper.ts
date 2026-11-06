import type {
  BookingCancellationPolicy,
  BookingDetails,
  BookingListItem,
  BookingPaymentStatus,
} from "@quickhotels/types/bookings";
import type { GuestTitle } from "@quickhotels/types/checkout";
import type { Money } from "@quickhotels/types/hotels";
import type { BookingForList, BookingWithDetails } from "./bookings.repository.js";
import { displayStatus } from "./booking-status.js";

const day = (date: Date) => date.toISOString().slice(0, 10);
const DAY_MS = 86_400_000;
const num = (value: { toString(): string } | null | undefined) => (value == null ? null : Number(value.toString()));
const money = (amount: number, currency: string): Money => ({ amount, currency });

const PAYMENT: Record<string, BookingPaymentStatus> = {
  CREATED: "pending",
  PENDING: "pending",
  CAPTURED: "paid",
  FAILED: "failed",
  REFUNDED: "refunded",
  PARTIALLY_REFUNDED: "partially_refunded",
};
const CANCELLATION = { REQUESTED: "requested", SUPPLIER_PENDING: "in_progress", CONFIRMED: "confirmed", REJECTED: "rejected", FAILED: "failed" } as const;
const REFUND = { PENDING: "pending", PROCESSING: "processing", COMPLETED: "completed", FAILED: "failed" } as const;
const TITLES = new Set<GuestTitle>(["Mr", "Mrs", "Ms", "Miss", "Master"]);

export function toListItem(booking: BookingForList | BookingWithDetails): BookingListItem {
  const adults = booking.rooms.reduce((sum, room) => sum + room.adults, 0);
  const children = booking.rooms.reduce((sum, room) => sum + room.childAges.length, 0);
  return {
    reference: booking.reference,
    status: displayStatus(booking.status),
    hotel: { id: booking.hotel.id, name: booking.hotel.name, city: booking.hotel.city, imageUrl: booking.hotel.heroImageUrl },
    checkIn: day(booking.checkIn),
    checkOut: day(booking.checkOut),
    nights: Math.round((booking.checkOut.getTime() - booking.checkIn.getTime()) / DAY_MS),
    rooms: booking.rooms.length,
    adults,
    children,
    total: money(num(booking.totalAmount)!, booking.currency),
    bookedAt: booking.createdAt.toISOString(),
  };
}

// The policy saved with the first room at booking time (spec §4.8: the
// snapshot, not today's hotel policy). Read defensively: it's stored JSON.
function policy(raw: unknown, currency: string): BookingCancellationPolicy | null {
  const value = raw as { refundable?: unknown; freeCancellationUntil?: unknown; charges?: unknown } | null;
  if (!value || typeof value !== "object") return null;
  const charges = Array.isArray(value.charges)
    ? value.charges.flatMap((charge: { from?: unknown; to?: unknown; amount?: { amount?: unknown } | unknown }) => {
        const amount = typeof charge.amount === "object" && charge.amount ? Number((charge.amount as { amount?: unknown }).amount) : Number(charge.amount);
        return typeof charge.from === "string" && typeof charge.to === "string" && Number.isFinite(amount)
          ? [{ from: charge.from, to: charge.to, amount: money(amount, currency) }]
          : [];
      })
    : [];
  return {
    refundable: value.refundable === true,
    freeCancellationUntil: typeof value.freeCancellationUntil === "string" ? value.freeCancellationUntil : null,
    charges,
  };
}

export function toDetails(booking: BookingWithDetails): BookingDetails {
  const currency = booking.currency;
  const snapshot = booking.priceSnapshot;
  const payment = booking.payments[0];
  const cancellation = booking.cancellations[0];
  return {
    ...toListItem(booking),
    supplierConfirmation: booking.supplierConfirmation,
    hotel: {
      id: booking.hotel.id,
      name: booking.hotel.name,
      city: booking.hotel.city,
      imageUrl: booking.hotel.heroImageUrl,
      address: booking.hotel.address,
      starRating: num(booking.hotel.starRating),
      latitude: num(booking.hotel.latitude),
      longitude: num(booking.hotel.longitude),
    },
    roomsBooked: booking.rooms.map((room) => ({
      name: room.roomName,
      mealPlan: room.mealPlan,
      adults: room.adults,
      childAges: room.childAges,
      guests: room.guests.map((guest) => ({
        title: guest.title && TITLES.has(guest.title as GuestTitle) ? (guest.title as GuestTitle) : null,
        firstName: guest.firstName,
        lastName: guest.lastName,
        child: guest.type === "CHILD",
        lead: guest.isLead,
      })),
    })),
    price: {
      total: money(num(booking.totalAmount)!, currency),
      taxes: money(num(snapshot?.taxes) ?? 0, currency),
      discount: money(num(snapshot?.discount) ?? 0, currency),
    },
    payment: payment
      ? { status: PAYMENT[payment.status] ?? "pending", method: payment.method, amount: money(num(payment.amount)!, payment.currency), at: payment.updatedAt.toISOString() }
      : null,
    cancellationPolicy: policy(booking.rooms[0]?.cancellationPolicy, currency),
    cancellation: cancellation
      ? {
          status: CANCELLATION[cancellation.status],
          penalty: cancellation.penaltyAmount == null ? null : money(num(cancellation.penaltyAmount)!, cancellation.currency ?? currency),
          refundEstimate: cancellation.refundEstimate == null ? null : money(num(cancellation.refundEstimate)!, cancellation.currency ?? currency),
          requestedAt: cancellation.requestedAt.toISOString(),
        }
      : null,
    refunds: (cancellation?.refunds ?? []).map((refund) => ({
      status: REFUND[refund.status],
      amount: money(num(refund.amount)!, refund.currency),
      at: (refund.completedAt ?? refund.updatedAt).toISOString(),
    })),
    // Each customer-facing status once, at the first time it was reached.
    timeline: booking.statusHistory.reduce<BookingDetails["timeline"]>((list, entry) => {
      const status = displayStatus(entry.toStatus);
      return list.some((item) => item.status === status) ? list : [...list, { status, at: entry.createdAt.toISOString() }];
    }, []),
    contact: { email: booking.contactEmail, phone: booking.contactPhone },
    specialRequests: booking.specialRequests,
  };
}
