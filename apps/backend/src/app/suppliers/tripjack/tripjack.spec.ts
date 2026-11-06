import { describe, expect, it } from "vitest";
import { destinationCountry, destinationNames, pickRegion, type RegionCandidate } from "./tripjack-destinations.js";
import { contentToRow, listingToResult, type CachedHotel } from "./tripjack.mapper.js";
import { toTripjackRooms } from "./tripjack-occupancy.js";
import type { TripjackHotelContent, TripjackListingResponse } from "./tripjack.types.js";

const search = { destination: "Goa", checkIn: "2026-12-20", checkOut: "2026-12-22" };

describe("toTripjackRooms", () => {
  it("spreads adults and children across rooms with their ages", () => {
    expect(toTripjackRooms({ ...search, rooms: 2, adults: 3, children: 3, childAges: [4, 7, 9] })).toEqual([
      { adults: 2, children: 2, childAge: [4, 9] },
      { adults: 1, children: 1, childAge: [7] },
    ]);
    expect(toTripjackRooms({ ...search, rooms: 1, adults: 2, children: 0 })).toEqual([{ adults: 2 }]);
  });

  it("refuses what TripJack can't take", () => {
    expect(toTripjackRooms({ ...search, rooms: 2, adults: 1, children: 0 })).toBeNull(); // a room without an adult
    expect(toTripjackRooms({ ...search, rooms: 1, adults: 7, children: 0 })).toBeNull(); // over 6 adults a room
    expect(toTripjackRooms({ ...search, rooms: 1, adults: 2, children: 5, childAges: [1, 2, 3, 4, 5] })).toBeNull(); // over 4 children
    expect(toTripjackRooms({ ...search, rooms: 1, adults: 2, children: 1 })).toBeNull(); // missing age
  });
});

describe("destinations", () => {
  it("normalises what people type, with common alternative names", () => {
    expect(destinationNames("  mumbai, india ")).toEqual(["MUMBAI"]);
    expect(destinationNames("Delhi")).toEqual(["DELHI", "NEW DELHI"]);
    expect(destinationNames("bangalore")).toEqual(["BANGALORE", "BENGALURU"]);
    expect(destinationNames("Alleppey")).toEqual(["ALLEPPEY", "ALAPPUZHA"]);
    expect(destinationCountry("Paris, France")).toBe("FRANCE");
    expect(destinationCountry("Goa")).toBeNull();
  });

  it("prefers an exact name, then India, then a city over a wider area", () => {
    const region = (regionId: string, name: string, countryName: string, regionType: string): RegionCandidate =>
      ({ regionId, name, cityName: name, countryName, regionType });
    const hyderabad = [
      region("1", "HYDERABAD", "PAKISTAN", "CITY"),
      region("2", "HYDERABAD", "INDIA", "MULTI_CITY_VICINITY"),
      region("3", "HYDERABAD", "INDIA", "CITY"),
    ];
    expect(pickRegion(hyderabad, ["HYDERABAD"])?.regionId).toBe("3");
    // Same name, very different places: the one with the most hotels wins.
    const bali = [
      { ...region("1", "BALI", "INDIA", "CITY"), hotelCount: 0 },
      { ...region("2", "BALI", "INDONESIA", "PROVINCE_STATE"), hotelCount: 9000 },
    ];
    expect(pickRegion(bali, ["BALI"])?.regionId).toBe("2");
    // A typed country narrows the choice.
    const paris = [
      { ...region("1", "PARIS", "UNITED STATES", "CITY"), hotelCount: 40 },
      { ...region("2", "PARIS", "FRANCE", "CITY"), hotelCount: 3000 },
    ];
    expect(pickRegion(paris, ["PARIS"], "UNITED STATES")?.regionId).toBe("1");
    expect(pickRegion(paris, ["PARIS"])?.regionId).toBe("2");
    expect(pickRegion([region("9", "GOA", "INDIA", "PROVINCE_STATE")], ["GOA"])?.regionId).toBe("9");
    expect(pickRegion([], ["NOWHERE"])).toBeNull();
  });
});

// Shapes as TripJack sent them in UAT (2026-11-04).
const content: TripjackHotelContent = {
  tjHotelId: "100000224831",
  name: " West End Hotel ",
  is_active: true,
  star_rating: "4",
  property_type: { id: "Hotel", name: "Hotel" },
  locale: { address: { fulladdr: "45 New Marine Lines, Mumbai", city: "MUMBAI", countryname: "India" }, coordinates: { lat: 18.94, long: 72.82 } },
  amenities: { "0": { id: "1", name: "Bar/Lounges" }, "1": { id: "2", name: "Bar/Lounges" }, "2": { id: "3", name: "Coffee Shop/Cafe" } },
  images: [
    { caption: "Lobby", links: { XXL: { href: "https://i.travelapi.com/lobby_z.jpg" } } },
    { caption: "Cover", is_hero_image: true, links: { XXL: { href: "https://i.travelapi.com/cover_z.jpg" } } },
  ],
  descriptions: { headline: "Near Marine Drive" },
};

describe("contentToRow", () => {
  it("keeps what we show and tidies it", () => {
    const row = contentToRow(content, "740051");
    expect(row).toMatchObject({
      supplierHotelId: "100000224831",
      regionId: "740051",
      name: "West End Hotel",
      city: "Mumbai",
      starRating: 4,
      propertyType: "Hotel",
      heroImageUrl: "https://i.travelapi.com/cover_z.jpg",
      description: "Near Marine Drive",
      facilities: ["Bar/Lounges", "Coffee Shop/Cafe"],
    });
    expect(row.images).toHaveLength(2);
  });
});

describe("listingToResult", () => {
  const cached: CachedHotel = {
    id: "hotel-uuid",
    supplierHotelId: "100000224831",
    name: "West End Hotel",
    city: "Mumbai",
    country: "India",
    address: "45 New Marine Lines",
    starRating: 4,
    propertyType: "Hotel",
    heroImageUrl: "https://i.travelapi.com/cover_z.jpg",
    facilities: ["Wifi", "Swimming Pool", "Fitness Center", "Pool", "Newspaper"],
    latitude: 18.94,
    longitude: 72.83,
  };
  const option = (optionId: string, totalPrice: number, mealBasis: string, isRefundable: boolean) => ({
    optionId,
    optionType: "SRSM" as const,
    roomInfo: [{ id: "1", name: "Deluxe" }],
    inclusions: [],
    mealBasis,
    pricing: { totalPrice, basePrice: totalPrice, discount: 0, taxes: 0, mf: 0, mft: 0, currency: "INR" },
    cancellation: { isRefundable, penalties: [] },
  });
  const listed: TripjackListingResponse["hotels"][number] = {
    hotelId: "100000224831",
    name: "West End Hotel",
    options: [option("a", 9000, "Breakfast", true), option("b", 7000, "Room Only", false)],
  };

  it("uses the cheapest option, and the cached name, photo and stars", () => {
    expect(listingToResult(listed, cached, 2)).toEqual({
      id: "hotel-uuid",
      name: "West End Hotel",
      city: "Mumbai",
      country: "India",
      rating: null,
      reviewCount: null,
      starRating: 4,
      imageUrl: "https://i.travelapi.com/cover_z.jpg",
      address: "45 New Marine Lines",
      propertyType: "Hotel",
      mealPlan: null,
      freeCancellation: false,
      // Each amenity once, unknown facilities dropped.
      amenities: ["wifi", "pool", "gym"],
      distanceKm: null,
      pricePerNight: { amount: 3500, currency: "INR" },
      totalPrice: { amount: 7000, currency: "INR" },
      taxesIncluded: true,
    });
  });

  it("skips hotels without options", () => {
    expect(listingToResult({ ...listed, options: [] }, cached, 2)).toBeNull();
  });
});
