import { createHash, timingSafeEqual } from "node:crypto";
import { BadRequestException } from "@nestjs/common";

// Checkouts (hotel and flight) open only with a random key the customer's
// browser made: it's the idempotency key when starting one and the secret
// that opens it afterwards. Only its SHA-256 hash is stored.

// The header's key, if it looks like one (a UUID or longer random string).
export function requireCheckoutKey(value: string | undefined, header: string) {
  if (!value || !/^[A-Za-z0-9_-]{32,128}$/.test(value)) throw new BadRequestException(`A valid ${header} header is required.`);
  return value;
}

export const hashCheckoutKey = (key: string) => createHash("sha256").update(key).digest("hex");

// Compares a key with a stored hash without leaking how much matched.
export function keyMatches(key: string, storedHash: string | null | undefined) {
  const given = Buffer.from(hashCheckoutKey(key));
  const stored = Buffer.from(storedHash ?? "");
  return given.length === stored.length && timingSafeEqual(given, stored);
}
