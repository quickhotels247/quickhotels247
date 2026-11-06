import { BadRequestException, GatewayTimeoutException, GoneException, ServiceUnavailableException } from "@nestjs/common";
import { describe, expect, it, vi } from "vitest";
import type { HotelSearchRequest, HotelSearchResult } from "@quickhotels/types/hotels";
import type { HotelSupplier } from "../../suppliers/hotel-supplier.js";
import { MockHotelSupplier } from "../../suppliers/mock/mock-hotel.supplier.js";
import { SupplierError } from "../../suppliers/supplier-error.js";
import { HotelsService } from "./hotels.service.js";
import type { SearchSessionsRepository } from "./search-sessions.repository.js";

const isoDay = (offsetDays: number) => new Date(Date.now() + offsetDays * 86_400_000).toISOString().slice(0, 10);

const request = (changes: Partial<HotelSearchRequest> = {}): HotelSearchRequest => ({
  destination: "Goa",
  checkIn: isoDay(10),
  checkOut: isoDay(13),
  rooms: 1,
  adults: 2,
  children: 0,
  ...changes,
});

function setup(supplier: HotelSupplier = new MockHotelSupplier()) {
  const sessions = { create: vi.fn(async () => "search-1"), find: vi.fn(), saveMore: vi.fn(async () => {}) };
  const service = new HotelsService(supplier, sessions as unknown as SearchSessionsRepository);
  return { service, sessions };
}

const failingSupplier = (error: SupplierError): HotelSupplier => ({
  name: "tripjack",
  sample: false,
  searchHotels: vi.fn(async () => {
    throw error;
  }),
  countHotels: vi.fn(async () => null),
  suggestDestinations: vi.fn(async () => []),
  hotelPage: vi.fn(async () => null),
  hotelRooms: vi.fn(async () => ({ options: [], expiresAt: new Date(), context: null })),
  refForHotel: vi.fn(() => null),
  reviewRoom: vi.fn(async () => { throw new Error("not used"); }),
});

const hotel = (id: string, price: number): HotelSearchResult => ({
  id, name: id, city: "Goa", country: "India", rating: null, reviewCount: null, starRating: 4, imageUrl: "",
  address: null, propertyType: "Hotel", mealPlan: null, freeCancellation: true, amenities: [], distanceKm: null, taxesIncluded: true,
  pricePerNight: { amount: price / 2, currency: "INR" }, totalPrice: { amount: price, currency: "INR" },
});

// A supplier that returns 10 hotels per batch, 3 batches in all.
function pagedSupplier(): HotelSupplier {
  return {
    name: "tripjack",
    sample: false,
    countHotels: vi.fn(async () => 30),
    suggestDestinations: vi.fn(async () => []),
    hotelPage: vi.fn(async () => null),
    hotelRooms: vi.fn(async () => ({ options: [], expiresAt: new Date(), context: null })),
    refForHotel: vi.fn(() => null),
    reviewRoom: vi.fn(async () => { throw new Error("not used"); }),
    searchHotels: vi.fn(async (_request, _context, options) => {
      const batch = (options?.cursor as number | undefined) ?? 0;
      const results = Array.from({ length: 10 }, (_, i) => hotel(`h${batch * 10 + i}`, 1000 + (batch * 10 + i) * 37 % 500));
      return { supplierSearchId: null, expiresAt: new Date(Date.now() + 600_000), results, context: null, nextCursor: batch < 2 ? batch + 1 : null };
    }),
  };
}

describe("HotelsService.search", () => {
  it("returns results with the stay length and records the search", async () => {
    const { service, sessions } = setup();
    const response = await service.search(request(), null);
    expect(response.searchId).toBe("search-1");
    expect(response.nights).toBe(3);
    expect(response.sample).toBe(true);
    expect(response.results.length).toBeGreaterThan(0);
    const first = response.results[0]!;
    expect(first.city).toBe("Goa");
    // The nightly figure is the stay total spread over the nights.
    expect(first.pricePerNight.amount).toBe(Math.round(first.totalPrice.amount / 3));
    expect(sessions.create).toHaveBeenCalledWith(expect.objectContaining({ supplier: "mock", userId: null }));
  });

  it("rejects check-out on or before check-in", async () => {
    const { service } = setup();
    await expect(service.search(request({ checkOut: isoDay(10) }), null)).rejects.toThrow(/after check-in/);
  });

  it("rejects check-in in the past", async () => {
    const { service } = setup();
    await expect(service.search(request({ checkIn: isoDay(-5), checkOut: isoDay(-2) }), null)).rejects.toThrow(/past/);
  });

  it("rejects stays over 30 nights and dates over a year ahead", async () => {
    const { service } = setup();
    await expect(service.search(request({ checkOut: isoDay(41) }), null)).rejects.toThrow(/30 nights/);
    await expect(service.search(request({ checkIn: isoDay(400), checkOut: isoDay(402) }), null)).rejects.toThrow(/within a year/);
  });

  it("needs the age of each child, and an adult per room", async () => {
    const { service } = setup();
    await expect(service.search(request({ children: 2, childAges: [5] }), null)).rejects.toBeInstanceOf(BadRequestException);
    await expect(service.search(request({ children: 1 }), null)).rejects.toThrow(/age of each child/);
    await expect(service.search(request({ rooms: 3, adults: 2 }), null)).rejects.toThrow(/at least one adult/);
    await expect(service.search(request({ children: 1, childAges: [7] }), null)).resolves.toBeDefined();
  });

  it("turns a supplier timeout into a 504 with a reference, not the raw error", async () => {
    const error = new SupplierError("TIMEOUT", "TripJack search failed: aborted", "tripjack", "abcdef12-3456");
    const { service, sessions } = setup(failingSupplier(error));
    const failure = service.search(request(), null);
    await expect(failure).rejects.toBeInstanceOf(GatewayTimeoutException);
    await expect(failure).rejects.toThrow(/Reference: abcdef12/);
    await expect(failure).rejects.not.toThrow(/aborted/);
    expect(sessions.create).not.toHaveBeenCalled();
  });

  it("turns a missing TripJack setup into a 503", async () => {
    const error = new SupplierError("NOT_CONFIGURED", "TRIPJACK_API_KEY is not set.", "tripjack", "ref-1");
    const { service } = setup(failingSupplier(error));
    await expect(service.search(request(), null)).rejects.toBeInstanceOf(ServiceUnavailableException);
  });
});

describe("HotelsService paging", () => {
  it("returns page 1 with hasMore while the supplier has more hotels", async () => {
    const { service } = setup(pagedSupplier());
    const page = await service.search(request(), null, { page: 1, pageSize: 5, sort: "recommended" });
    expect(page.results.map((h) => h.id)).toEqual(["h0", "h1", "h2", "h3", "h4"]);
    expect(page).toMatchObject({ page: 1, pageSize: 5, total: 10, hasMore: true });
  });

  it("prices more hotels when a later page needs them, without duplicates", async () => {
    const supplier = pagedSupplier();
    const { service, sessions } = setup(supplier);
    sessions.find.mockResolvedValue({
      id: "search-1", request: request(), supplier: "tripjack", supplierContext: null,
      results: Array.from({ length: 10 }, (_, i) => hotel(`h${i}`, 1000)), nextCursor: 1, centre: null, expiresAt: new Date(Date.now() + 600_000),
    });
    const page = await service.results("search-1", { page: 3, pageSize: 10, sort: "recommended" });
    expect(page.results.map((h) => h.id)).toEqual(Array.from({ length: 10 }, (_, i) => `h${20 + i}`));
    expect(page).toMatchObject({ total: 30, hasMore: false });
    expect(supplier.searchHotels).toHaveBeenCalledTimes(2);
    expect(sessions.saveMore).toHaveBeenCalledTimes(2);
  });

  it("sorts across everything found so far", async () => {
    const { service } = setup(pagedSupplier());
    const page = await service.search(request(), null, { page: 1, pageSize: 10, sort: "price_asc" });
    const prices = page.results.map((h) => h.totalPrice.amount);
    expect(prices).toEqual([...prices].sort((a, b) => a - b));
  });

  it("filters before paging, pricing more hotels to fill a filtered page", async () => {
    const supplier = pagedSupplier();
    const { service, sessions } = setup(supplier);
    sessions.find.mockResolvedValue({
      id: "search-1", request: request(), supplier: "tripjack", supplierContext: null,
      results: Array.from({ length: 10 }, (_, i) => hotel(`h${i}`, 1000 + i * 100)), nextCursor: 1, centre: null, expiresAt: new Date(Date.now() + 600_000),
    });
    // 8 of the stored hotels cost 600+ a night, so a page of 10 needs the next batch.
    const page = await service.results("search-1", { page: 1, pageSize: 10, sort: "recommended", filters: { minPrice: 600 } });
    expect(page.results.every((h) => h.pricePerNight.amount >= 600)).toBe(true);
    expect(page.results).toHaveLength(10);
    expect(page.priced).toBeGreaterThan(page.total);
    expect(page.facets.stars).toEqual({ "4": page.priced });
    expect(supplier.searchHotels).toHaveBeenCalled();
  });

  it("refuses pages of an expired search", async () => {
    const { service, sessions } = setup(pagedSupplier());
    sessions.find.mockResolvedValue({
      id: "search-1", request: request(), supplier: "tripjack", supplierContext: null, results: [], nextCursor: null, centre: null,
      expiresAt: new Date(Date.now() - 1000),
    });
    await expect(service.results("search-1", { page: 2, pageSize: 10, sort: "recommended" })).rejects.toBeInstanceOf(GoneException);
  });
});
