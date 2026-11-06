import { Injectable } from "@nestjs/common";
import type { DestinationSuggestion, HotelSearchRequest, HotelSearchResult, RoomOption } from "@quickhotels/types/hotels";
import type { HotelPageContent, HotelSupplier, SupplierReviewResult, SupplierRoomsResult, SupplierSearchResult } from "../hotel-supplier.js";
import { SupplierError } from "../supplier-error.js";
import { MOCK_HOTELS, mockImageUrl } from "./mock-hotels.data.js";

const GST_RATE = 0.12; // a flat sample rate; real taxes come from the supplier
const SEARCH_TTL_MS = 15 * 60 * 1000;

const nightsBetween = (checkIn: string, checkOut: string) =>
  Math.round((Date.parse(`${checkOut}T00:00:00Z`) - Date.parse(`${checkIn}T00:00:00Z`)) / 86_400_000);

// Sample supplier for development: same shapes as a real supplier, made-up
// hotels in whatever city was searched. Never used in production.
@Injectable()
export class MockHotelSupplier implements HotelSupplier {
  readonly name = "mock";
  readonly sample = true;

  async searchHotels(request: HotelSearchRequest): Promise<SupplierSearchResult> {
    const nights = nightsBetween(request.checkIn, request.checkOut);
    const city = request.destination.trim();
    const results: HotelSearchResult[] = MOCK_HOTELS.map((hotel) => {
      // More guests need more rooms; price scales with rooms.
      const nightly = hotel.nightlyRate * request.rooms;
      const total = Math.round(nightly * nights * (1 + GST_RATE));
      return {
        id: `mock-${hotel.slug}`,
        name: hotel.name,
        city,
        country: "India",
        rating: hotel.rating,
        reviewCount: hotel.reviewCount,
        starRating: null,
        imageUrl: mockImageUrl(hotel),
        address: `${city} city centre`,
        propertyType: hotel.propertyType,
        mealPlan: hotel.mealPlan,
        freeCancellation: hotel.freeCancellation,
        amenities: hotel.propertyType === "Resort" ? ["wifi", "pool", "spa", "restaurant"] : ["wifi", "parking"],
        distanceKm: Math.round((1 + (hotel.nightlyRate % 97) / 6) * 10) / 10,
        pricePerNight: { amount: Math.round(total / nights), currency: "INR" },
        totalPrice: { amount: total, currency: "INR" },
        taxesIncluded: true,
      };
    });
    return {
      supplierSearchId: null,
      expiresAt: new Date(Date.now() + SEARCH_TTL_MS),
      results,
      context: null,
      nextCursor: null,
      centre: { name: "the city centre", kind: "landmark" },
    };
  }

  async countHotels(): Promise<number | null> {
    return MOCK_HOTELS.length;
  }

  // Sample hotels have no extra content; the page shows their basics.
  async hotelPage(): Promise<HotelPageContent | null> {
    return null;
  }

  // Three sample rates, so the hotel page can be tried without TripJack.
  async hotelRooms(request: HotelSearchRequest): Promise<SupplierRoomsResult> {
    const nights = nightsBetween(request.checkIn, request.checkOut);
    const rate = (id: string, roomName: string, nightly: number, mealPlan: string | null, refundable: boolean): RoomOption => {
      const total = Math.round(nightly * request.rooms * nights * (1 + GST_RATE));
      return {
        id, roomTypeId: null, roomName, mealPlan, inclusions: [], notes: null,
        freeCancellation: refundable,
        freeCancellationUntil: refundable ? `${request.checkIn}T00:00:00` : null,
        cancellationCharges: [],
        totalPrice: { amount: total, currency: "INR" },
        pricePerNight: { amount: Math.round(total / nights), currency: "INR" },
        strikethroughPrice: null,
        priceBreakup: { base: Math.round(total / (1 + GST_RATE)), taxes: total - Math.round(total / (1 + GST_RATE)), managementFee: 0, managementFeeTax: 0, discount: 0 },
        panRequired: false,
        passportRequired: false,
      };
    };
    return {
      options: [
        rate("mock-standard", "Standard Room", 3200, null, false),
        rate("mock-standard-bb", "Standard Room", 3700, "Breakfast", true),
        rate("mock-deluxe-bb", "Deluxe Room", 5200, "Breakfast", true),
      ],
      expiresAt: new Date(Date.now() + SEARCH_TTL_MS),
      context: null,
    };
  }

  // The sample rate again, unchanged.
  async reviewRoom(request: HotelSearchRequest, _roomsContext: unknown, optionId: string): Promise<SupplierReviewResult> {
    const option = (await this.hotelRooms(request)).options.find((rate) => rate.id === optionId);
    if (!option) throw new SupplierError("SOLD_OUT", `No sample rate ${optionId}.`, this.name, "mock");
    return { option, context: null };
  }

  refForHotel(): string | null {
    return null;
  }

  // A few Indian cities, so the search box can be tried without TripJack.
  async suggestDestinations(query: string, limit: number): Promise<DestinationSuggestion[]> {
    const typed = query.trim().toLowerCase();
    return MOCK_CITIES.filter(([name]) => name.toLowerCase().split(" ").some((word) => word.startsWith(typed)))
      .slice(0, limit)
      .map(([name, state]) => ({
        id: `mock-${name.toLowerCase().replace(/\s+/g, "-")}`,
        name,
        detail: `${state}, India`,
        kind: "city",
        query: `${name}, India`,
        hotelCount: MOCK_HOTELS.length,
      }));
  }
}

const MOCK_CITIES: [string, string][] = [
  ["Goa", "Goa"], ["Mumbai", "Maharashtra"], ["New Delhi", "Delhi"], ["Jaipur", "Rajasthan"], ["Bengaluru", "Karnataka"],
  ["Hyderabad", "Telangana"], ["Chennai", "Tamil Nadu"], ["Kolkata", "West Bengal"], ["Manali", "Himachal Pradesh"], ["Kochi", "Kerala"],
];
