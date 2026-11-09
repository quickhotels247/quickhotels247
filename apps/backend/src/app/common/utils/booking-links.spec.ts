import { afterEach, describe, expect, it, vi } from "vitest";
import { bookingLinkToken, bookingLinkValid } from "./booking-links.js";

describe("booking links", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("accepts its own token and nothing else", () => {
    vi.stubEnv("BOOKING_LINK_SECRET", "s3cret");
    const token = bookingLinkToken("flight", "fc1");
    expect(bookingLinkValid("flight", "fc1", token)).toBe(true);
    expect(bookingLinkValid("flight", "fc2", token)).toBe(false);
    expect(bookingLinkValid("hotel", "fc1", token)).toBe(false);
    expect(bookingLinkValid("flight", "fc1", "x".repeat(32))).toBe(false);
    expect(bookingLinkValid("flight", "fc1", undefined)).toBe(false);
  });

  it("changes with the secret", () => {
    vi.stubEnv("BOOKING_LINK_SECRET", "one");
    const first = bookingLinkToken("flight", "fc1");
    vi.stubEnv("BOOKING_LINK_SECRET", "two");
    expect(bookingLinkToken("flight", "fc1")).not.toBe(first);
  });
});
