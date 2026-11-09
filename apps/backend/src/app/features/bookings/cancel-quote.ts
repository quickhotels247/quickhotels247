import type { BookingCancellationPolicy, BookingCancelQuote } from "@quickhotels/types/bookings";
import type { Money } from "@quickhotels/types/hotels";

// India time now, as the policy writes it ("2026-11-28T12:00").
export const indiaNow = (now = Date.now()) => new Date(now + 330 * 60_000).toISOString().slice(0, 16);

const round = (value: number) => Math.round(value * 100) / 100;

// The fee for cancelling at `at` (India time) under the policy sold with
// the booking (our markup already in its charges), never more than was paid.
export function cancellationFee(policy: BookingCancellationPolicy | null, paid: number, at: string): number {
  if (!policy) return paid;
  if (policy.freeCancellationUntil && at < policy.freeCancellationUntil) return 0;
  const charges = [...policy.charges].sort((a, b) => a.from.localeCompare(b.from));
  const current = charges.find((charge) => charge.from <= at && at < charge.to);
  if (current) return Math.min(paid, current.amount.amount);
  if (charges.length && at < charges[0]!.from) return policy.refundable ? 0 : paid;
  // Past every slab (or no slabs): refundable bookings follow the last slab.
  const last = charges.at(-1);
  if (last && policy.refundable) return Math.min(paid, last.amount.amount);
  return paid;
}

// Can the customer cancel now, and what comes back?
export function cancelQuote(input: {
  status: string;
  checkIn: string; // YYYY-MM-DD
  paid: Money;
  policy: BookingCancellationPolicy | null;
  now?: number;
}): BookingCancelQuote {
  const at = indiaNow(input.now);
  const fee = round(cancellationFee(input.policy, input.paid.amount, at));
  const quote = (allowed: boolean, reason: string | null): BookingCancelQuote => ({
    allowed,
    reason,
    fee: { amount: fee, currency: input.paid.currency },
    refund: { amount: round(Math.max(0, input.paid.amount - fee)), currency: input.paid.currency },
  });
  if (input.status !== "confirmed") return quote(false, "Only confirmed bookings can be cancelled here.");
  if (at.slice(0, 10) > input.checkIn) return quote(false, "The check-in date has passed. Please contact support.");
  return quote(true, null);
}
