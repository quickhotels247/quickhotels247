import { describe, expect, it } from "vitest";
import type { HotelSearchResult } from "@quickhotels/types/hotels";
import { filterHotels, hotelFacets } from "./hotel-filters.js";

const hotel = (id: string, changes: Partial<HotelSearchResult> & { night?: number } = {}): HotelSearchResult => {
  const { night = 2000, ...rest } = changes;
  return {
    id, name: id, city: "Goa", country: "India", rating: null, reviewCount: null, starRating: 4, imageUrl: "",
    address: null, propertyType: "Hotel", mealPlan: null, freeCancellation: false, amenities: [], distanceKm: null, taxesIncluded: true,
    pricePerNight: { amount: night, currency: "INR" }, totalPrice: { amount: night * 2, currency: "INR" },
    ...rest,
  };
};

const hotels = [
  hotel("a", { starRating: 5, freeCancellation: true, night: 9000.4, propertyType: "Resort", amenities: ["pool", "spa", "wifi"], distanceKm: 12.4 }),
  hotel("b", { starRating: 4, mealPlan: "Breakfast", night: 3500, amenities: ["wifi"], distanceKm: 2.1 }),
  hotel("c", { starRating: null, night: 1200.6, name: "Sea View Homestay", propertyType: "GuestHouse" }),
  hotel("d", { starRating: 3, freeCancellation: true, mealPlan: "Half board", night: 2500, amenities: ["pool", "wifi"], distanceKm: 5 }),
];
const ids = (list: HotelSearchResult[]) => list.map((h) => h.id);

describe("filterHotels", () => {
  it("keeps everything without filters", () => {
    expect(ids(filterHotels(hotels))).toEqual(["a", "b", "c", "d"]);
  });

  it("matches star categories, with 0 for hotels without one", () => {
    expect(ids(filterHotels(hotels, { stars: [5, 0] }))).toEqual(["a", "c"]);
  });

  it("combines filters", () => {
    expect(ids(filterHotels(hotels, { freeCancellation: true }))).toEqual(["a", "d"]);
    expect(ids(filterHotels(hotels, { mealIncluded: true, maxPrice: 3000 }))).toEqual(["d"]);
    expect(ids(filterHotels(hotels, { minPrice: 2500, maxPrice: 4000 }))).toEqual(["b", "d"]);
  });

  it("matches property types, every chosen amenity, and part of the name", () => {
    expect(ids(filterHotels(hotels, { propertyTypes: ["resort", "GuestHouse"] }))).toEqual(["a", "c"]);
    expect(ids(filterHotels(hotels, { amenities: ["pool", "wifi"] }))).toEqual(["a", "d"]);
    expect(ids(filterHotels(hotels, { amenities: ["pool", "spa"] }))).toEqual(["a"]);
    expect(ids(filterHotels(hotels, { name: "  sea VIEW " }))).toEqual(["c"]);
  });

  it("keeps hotels within a distance, leaving out those without a known location", () => {
    expect(ids(filterHotels(hotels, { maxDistanceKm: 5 }))).toEqual(["b", "d"]);
  });
});

describe("hotelFacets", () => {
  it("counts features, and gives a round price range from ₹1,000", () => {
    expect(hotelFacets(hotels)).toEqual({
      stars: { "5": 1, "4": 1, "0": 1, "3": 1 },
      freeCancellation: 2,
      mealIncluded: 2,
      propertyTypes: { Resort: 1, Hotel: 2, GuestHouse: 1 },
      amenities: { pool: 2, spa: 1, wifi: 3 },
      distanceKm: { max: 13 },
      pricePerNight: { min: 1000, max: 10000 },
    });
  });

  it("starts the price range at ₹0 when there are cheaper rooms", () => {
    expect(hotelFacets([hotel("x", { night: 800 }), hotel("y", { night: 2300 })]).pricePerNight).toEqual({ min: 0, max: 3000 });
  });

  it("ends the price range below a few outliers", () => {
    const many = Array.from({ length: 40 }, (_, i) => hotel(`h${i}`, { night: 1000 + i * 100 }));
    const outliers = [hotel("villa", { night: 1_500_000 }), hotel("palace", { night: 900_000 })];
    expect(hotelFacets([...many, ...outliers]).pricePerNight).toEqual({ min: 1000, max: 5000 });
  });

  it("has no price range without hotels", () => {
    expect(hotelFacets([]).pricePerNight).toBeNull();
  });
});
