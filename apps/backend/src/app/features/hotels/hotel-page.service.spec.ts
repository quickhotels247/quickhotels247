import { NotFoundException } from "@nestjs/common";
import { describe, expect, it, vi } from "vitest";
import type { HotelSupplier } from "../../suppliers/hotel-supplier.js";
import { MockHotelSupplier } from "../../suppliers/mock/mock-hotel.supplier.js";
import type { HotelPageRepository, StoredHotel } from "./hotel-page.repository.js";
import { HotelPageService } from "./hotel-page.service.js";
import type { SearchSessionsRepository } from "./search-sessions.repository.js";

const isoDay = (offsetDays: number) => new Date(Date.now() + offsetDays * 86_400_000).toISOString().slice(0, 10);

const stored = (changes: Partial<StoredHotel> = {}): StoredHotel => ({
  id: "hotel-1", supplier: "mock", supplierHotelId: "100", name: "Sea Breeze", isActive: true, starRating: 4,
  propertyType: "Hotel", address: "Baga", city: "Goa", country: "India", latitude: 15.5, longitude: 73.8,
  heroImageUrl: "https://img/hero.jpg", headline: "On the beach", facilities: ["Wifi"], images: [], page: null, pageFetchedAt: null,
  ...changes,
});

function setup(hotel: StoredHotel | null, supplier: HotelSupplier = new MockHotelSupplier()) {
  const hotels = { find: vi.fn(async () => hotel), savePage: vi.fn(async () => {}) };
  const sessions = { create: vi.fn(async () => "rooms-1"), find: vi.fn(async () => null) };
  const service = new HotelPageService(supplier, hotels as unknown as HotelPageRepository, sessions as unknown as SearchSessionsRepository);
  return { service, hotels, sessions };
}

const stay = { destination: "", checkIn: isoDay(5), checkOut: isoDay(7), rooms: 1, adults: 2, children: 0 };

describe("HotelPageService", () => {
  it("falls back to the search-time content when there's no page content", async () => {
    const { service } = setup(stored());
    const details = await service.details("hotel-1");
    expect(details).toMatchObject({ name: "Sea Breeze", headline: "On the beach", facilities: ["Wifi"], description: [], roomTypes: [] });
    expect(details.images).toEqual([{ url: "https://img/hero.jpg", caption: null }]);
  });

  it("hides inactive or unknown hotels", async () => {
    await expect(setup(stored({ isActive: false })).service.details("hotel-1")).rejects.toBeInstanceOf(NotFoundException);
    await expect(setup(null).service.details("nope")).rejects.toBeInstanceOf(NotFoundException);
  });

  it("returns rooms for the stay and opens a rooms session for checkout", async () => {
    const { service, sessions } = setup(stored());
    const rooms = await service.rooms("hotel-1", stay);
    expect(rooms).toMatchObject({ hotelId: "hotel-1", roomsId: "rooms-1", nights: 2, sample: true });
    expect(rooms.options.map((option) => option.totalPrice.amount)).toEqual([...rooms.options.map((o) => o.totalPrice.amount)].sort((a, b) => a - b));
    expect(sessions.create).toHaveBeenCalledWith(expect.objectContaining({ supplierContext: expect.objectContaining({ kind: "rooms", hotelId: "hotel-1" }) }));
  });

  it("checks the stay like a search does", async () => {
    const { service } = setup(stored());
    await expect(service.rooms("hotel-1", { ...stay, children: 1 })).rejects.toThrow(/age of each child/);
  });
});
