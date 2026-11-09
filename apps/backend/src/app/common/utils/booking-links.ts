import { createHash, createHmac, timingSafeEqual } from "node:crypto";

// Private links to a booking (in confirmation emails), so it opens on any
// device without signing in: an HMAC of the booking id. BOOKING_LINK_SECRET
// can set the key; otherwise one is derived from the database address, which
// only the server knows (changing it makes old links stop working).
function key() {
  const configured = process.env.BOOKING_LINK_SECRET?.trim();
  if (configured) return configured;
  return createHash("sha256").update(`booking-links:${process.env.DATABASE_URL ?? "local"}`).digest("hex");
}

export function bookingLinkToken(kind: "flight" | "hotel", id: string): string {
  return createHmac("sha256", key()).update(`${kind}:${id}`).digest("base64url").slice(0, 32);
}

export function bookingLinkValid(kind: "flight" | "hotel", id: string, token: string | undefined | null): boolean {
  if (!token) return false;
  const expected = Buffer.from(bookingLinkToken(kind, id));
  const given = Buffer.from(token);
  return expected.length === given.length && timingSafeEqual(expected, given);
}
