import { describe, expect, it } from "vitest";
import { cancelQuote, cancellationFee } from "./cancel-quote.js";

const inr = (amount: number) => ({ amount, currency: "INR" });
const policy = {
  refundable: true,
  freeCancellationUntil: "2026-11-28T12:00",
  charges: [
    { from: "2026-11-01T00:00", to: "2026-11-28T12:00", amount: inr(0) },
    { from: "2026-11-28T12:00", to: "2026-11-30T12:00", amount: inr(3000) },
    { from: "2026-11-30T12:00", to: "2026-12-01T12:00", amount: inr(5500) },
  ],
};

describe("cancellation fee", () => {
  it("is free in the free window, then follows the slabs, capped at what was paid", () => {
    expect(cancellationFee(policy, 5400, "2026-11-20T10:00")).toBe(0);
    expect(cancellationFee(policy, 5400, "2026-11-29T10:00")).toBe(3000);
    expect(cancellationFee(policy, 5400, "2026-11-30T18:00")).toBe(5400);
  });

  it("keeps everything for non-refundable or unknown policies", () => {
    expect(cancellationFee({ refundable: false, freeCancellationUntil: null, charges: [] }, 5400, "2026-11-20T10:00")).toBe(5400);
    expect(cancellationFee(null, 5400, "2026-11-20T10:00")).toBe(5400);
  });

  it("quotes the refund, and only for confirmed stays not yet started", () => {
    const now = Date.parse("2026-11-29T04:30:00Z"); // 10:00 in India
    expect(cancelQuote({ status: "confirmed", checkIn: "2026-12-01", paid: inr(5400), policy, now })).toEqual({ allowed: true, reason: null, fee: inr(3000), refund: inr(2400) });
    expect(cancelQuote({ status: "pending", checkIn: "2026-12-01", paid: inr(5400), policy, now }).allowed).toBe(false);
    expect(cancelQuote({ status: "confirmed", checkIn: "2026-11-28", paid: inr(5400), policy, now }).allowed).toBe(false);
  });
});
