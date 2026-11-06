import { BadRequestException, ConflictException, NotFoundException } from "@nestjs/common";
import { describe, expect, it, vi } from "vitest";
import type { CheckoutGuestDetails } from "@quickhotels/types/checkout";
import type { RoomOption } from "@quickhotels/types/hotels";
import type { HotelSupplier } from "../../suppliers/hotel-supplier.js";
import { SupplierError } from "../../suppliers/supplier-error.js";
import type { HotelPageRepository, StoredHotel } from "../hotels/hotel-page.repository.js";
import type { SearchSessionsRepository } from "../hotels/search-sessions.repository.js";
import type { CheckoutRepository, NewCheckout, StoredCheckout } from "./checkout.repository.js";
import { CheckoutService } from "./checkout.service.js";

const isoDay = (offsetDays: number) => new Date(Date.now() + offsetDays * 86_400_000).toISOString().slice(0, 10);
const KEY = "k".repeat(40);

const rate = (amount: number, changes: Partial<RoomOption> = {}): RoomOption => ({
  id: "opt-1", roomTypeId: null, roomName: "Deluxe", mealPlan: "Breakfast", inclusions: [], notes: null,
  freeCancellation: true, freeCancellationUntil: null, cancellationCharges: [],
  totalPrice: { amount, currency: "INR" }, pricePerNight: { amount: amount / 2, currency: "INR" }, strikethroughPrice: null,
  priceBreakup: { base: amount, taxes: 0, managementFee: 0, managementFeeTax: 0, discount: 0 },
  panRequired: false, passportRequired: false, ...changes,
});

const hotel = { id: "hotel-1", name: "Sea Breeze", isActive: true, starRating: 4, address: "Baga", city: "Goa", heroImageUrl: null, page: null } as unknown as StoredHotel;

function setup({ reviewed = rate(9000), shown = 9000, children = 0 }: { reviewed?: RoomOption | Error; shown?: number; children?: number } = {}) {
  const rows = new Map<string, StoredCheckout & { keyHash: string }>();
  const checkouts = {
    findByKeyHash: vi.fn(async (keyHash: string) => [...rows.values()].find((row) => row.keyHash === keyHash) ?? null),
    find: vi.fn(async (id: string) => rows.get(id) ?? null),
    create: vi.fn(async (checkout: NewCheckout) => {
      const id = `checkout-${rows.size + 1}`;
      rows.set(id, { id, keyHash: checkout.keyHash, accessTokenHash: checkout.keyHash, status: checkout.status, expiresAt: checkout.expiresAt, quote: checkout.quote, guestDetails: null, termsVersion: null });
      return id;
    }),
    saveGuests: vi.fn(async (id: string, _from: unknown, details: CheckoutGuestDetails) => {
      const row = rows.get(id)!;
      rows.set(id, { ...row, guestDetails: details, status: "AWAITING_PAYMENT" });
    }),
  };
  const request = { destination: "Sea Breeze", checkIn: isoDay(5), checkOut: isoDay(7), rooms: 1, adults: 2, children, ...(children ? { childAges: [6] } : {}) };
  const sessions = {
    find: vi.fn(async () => ({
      id: "rooms-1", request, supplier: "tripjack", results: [], nextCursor: null, centre: null,
      supplierContext: { kind: "rooms", hotelId: "hotel-1", supplier: { correlationId: "c" }, shownPrices: { "opt-1": { amount: shown, currency: "INR" } } },
      expiresAt: new Date(Date.now() + 600_000),
    })),
  };
  const supplier = {
    name: "tripjack",
    reviewRoom: vi.fn(async () => {
      if (reviewed instanceof Error) throw reviewed;
      return { option: reviewed, context: { bookingId: "TGS1" } };
    }),
  } as unknown as HotelSupplier;
  const hotels = { find: vi.fn(async () => hotel) };
  const service = new CheckoutService(supplier, checkouts as unknown as CheckoutRepository, sessions as unknown as SearchSessionsRepository, hotels as unknown as HotelPageRepository);
  return { service, supplier, checkouts };
}

const details = (changes: Partial<CheckoutGuestDetails> = {}): CheckoutGuestDetails => ({
  contact: { email: "asha@example.com", phoneCode: "+91", phone: "9876543210" },
  rooms: [{ guests: [{ title: "Ms", firstName: "Asha", lastName: "Rao" }, { title: "Mr", firstName: "Ravi", lastName: "Rao" }] }],
  acceptTerms: true,
  ...changes,
});

describe("CheckoutService", () => {
  it("reviews the rate once per key and returns the server's quote", async () => {
    const { service, supplier } = setup();
    const first = await service.create("rooms-1", "opt-1", KEY);
    const again = await service.create("rooms-1", "opt-1", KEY);
    expect(again.checkoutId).toBe(first.checkoutId);
    expect(supplier.reviewRoom).toHaveBeenCalledTimes(1);
    expect(first).toMatchObject({ status: "details", nights: 2, rooms: [{ adults: 2, childAges: [] }], priceChange: null });
    expect(first.room.totalPrice.amount).toBe(9000);
  });

  it("shares one review between requests that arrive together", async () => {
    const { service, supplier } = setup();
    const [a, b] = await Promise.all([service.create("rooms-1", "opt-1", KEY), service.create("rooms-1", "opt-1", KEY)]);
    expect(a.checkoutId).toBe(b.checkoutId);
    expect(supplier.reviewRoom).toHaveBeenCalledTimes(1);
  });

  it("flags a changed price and needs it accepted", async () => {
    const { service } = setup({ reviewed: rate(9500), shown: 9000 });
    const checkout = await service.create("rooms-1", "opt-1", KEY);
    expect(checkout.priceChange).toEqual({ previous: { amount: 9000, currency: "INR" }, current: { amount: 9500, currency: "INR" } });
    await expect(service.saveGuests(checkout.checkoutId, KEY, details())).rejects.toBeInstanceOf(ConflictException);
    await expect(service.saveGuests(checkout.checkoutId, KEY, details({ acceptPriceChange: true }))).resolves.toMatchObject({ status: "payment" });
  });

  it("says when the rate sold out", async () => {
    const { service } = setup({ reviewed: new SupplierError("SOLD_OUT", "gone", "tripjack", "ref") });
    await expect(service.create("rooms-1", "opt-1", KEY)).rejects.toThrow(/sold out/);
  });

  it("opens only with the key that created it", async () => {
    const { service } = setup();
    const { checkoutId } = await service.create("rooms-1", "opt-1", KEY);
    await expect(service.get(checkoutId, "x".repeat(40))).rejects.toBeInstanceOf(NotFoundException);
    await expect(service.get(checkoutId, KEY)).resolves.toMatchObject({ checkoutId });
  });

  it("checks guests against the rooms and the rate's needs", async () => {
    const { service } = setup({ reviewed: rate(9000, { panRequired: true }), children: 1 });
    const { checkoutId } = await service.create("rooms-1", "opt-1", KEY);
    const adultsAndChild = (pan?: string) => [
      { title: "Ms" as const, firstName: "Asha", lastName: "Rao", pan },
      { title: "Mr" as const, firstName: "Ravi", lastName: "Rao", pan },
      { title: "Master" as const, firstName: "Kiran", lastName: "Rao", pan },
    ];
    // Two guests for a room of three.
    await expect(service.saveGuests(checkoutId, KEY, details())).rejects.toThrow(/needs 3 guests/);
    await expect(service.saveGuests(checkoutId, KEY, details({ rooms: [{ guests: adultsAndChild() }] }))).rejects.toThrow(/PAN/);
    const childAsMr = adultsAndChild("ABCDE1234F").map((guest, i) => (i === 2 ? { ...guest, title: "Mr" as const } : guest));
    await expect(service.saveGuests(checkoutId, KEY, details({ rooms: [{ guests: childAsMr }] }))).rejects.toThrow(/Master or Miss/);
    await expect(service.saveGuests(checkoutId, KEY, details({ rooms: [{ guests: adultsAndChild("ABCDE1234F") }] }))).resolves.toMatchObject({ status: "payment" });
  });

  it("wants a 10-digit Indian mobile for +91", async () => {
    const { service } = setup();
    const { checkoutId } = await service.create("rooms-1", "opt-1", KEY);
    await expect(service.saveGuests(checkoutId, KEY, details({ contact: { email: "a@b.co", phoneCode: "+91", phone: "12345" } }))).rejects.toBeInstanceOf(BadRequestException);
  });
});
