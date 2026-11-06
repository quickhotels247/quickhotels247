import { describe, expect, it, vi } from "vitest";
import { bestImageUrl, contentToHotelPage, time, toRoomOption } from "./tripjack-hotel-page.mapper.js";
import type { TripjackHotelContent, TripjackOption } from "./tripjack.types.js";

describe("contentToHotelPage", () => {
  const hotel: TripjackHotelContent = {
    tjHotelId: "1",
    name: "Sea Breeze",
    amenities: { "1": { id: "1", name: "Wifi" }, "2": { id: "2", name: "Swimming Pool" } },
    images: [
      { caption: "Lobby", links: { "70px": { href: "https://img/lobby_t.jpg" }, "1000px": { href: "https://img/lobby_z.jpg" } } },
      { caption: "Featured Image", is_hero_image: true, links: { original: { href: "https://img/hero.jpg" } } },
    ],
    descriptions: {
      headline: "On the beach",
      default: "<p>A calm stay.</p>",
      location: "<p>5 minutes from <b>Baga</b>.</p>",
    },
    policies: {
      checkInCheckOut: { checkin_from: "14:00", checkout_till: "11:00", checkin_min_age: "18" },
      mandatory_fees: "<ul><li>City tax INR 100</li></ul>",
      houseRules: { pets: "Not allowed" },
    },
    rooms: {
      "0": { id: "R1", name: "Deluxe", bed_config: { description: "1 King Bed" }, area: { square_meters: 24.6 }, occupancy: { max_allowed: { total: 3 } } },
    },
  };

  it("maps content to the hotel page, as plain text", () => {
    const page = contentToHotelPage(hotel);
    expect(page.images.map((image) => image.url)).toEqual(["https://img/hero.jpg", "https://img/lobby_z.jpg"]);
    expect(page.description).toEqual([
      { title: "About this property", paragraphs: ["A calm stay."] },
      { title: "Location", paragraphs: ["5 minutes from Baga."] },
    ]);
    expect(page.amenities).toEqual(["wifi", "pool"]);
    expect(page.checkIn).toEqual({ from: "14:00", until: null, minAge: 18 });
    expect(page.checkOut).toEqual({ from: null, until: "11:00" });
    expect(page.policies[0]).toEqual({ title: "Fees paid at the property", paragraphs: ["City tax INR 100"] });
    expect(page.policies.at(-1)).toEqual({ title: "House rules", paragraphs: ["Pets: Not allowed"] });
    expect(page.roomTypes[0]).toMatchObject({ id: "R1", name: "Deluxe", beds: "1 King Bed", areaSqM: 25, maxGuests: 3 });
  });

  it("unpacks policies sent as JSON in a string, filing optional fees as optional", () => {
    const page = contentToHotelPage({
      tjHotelId: "2",
      name: "Bael Tree",
      policies: {
        mandatory_fees: '{"Optional":"Airport shuttle fee: INR 3200 per vehicle (one-way)Rollaway bed fee: INR 750 per day"}',
        know_before_you_go: '{"know_before_you_go":"No pets allowed."}',
      },
    });
    expect(page.policies).toEqual([
      { title: "Know before you go", paragraphs: ["No pets allowed."] },
      { title: "Optional extras", paragraphs: ["Airport shuttle fee: INR 3200 per vehicle (one-way)", "Rollaway bed fee: INR 750 per day"] },
    ]);
  });

  it("reads check-in times written either way", () => {
    expect(time("2:00 PM")).toBe("14:00");
    expect(time("11:00 AM")).toBe("11:00");
    expect(time("12:30 am")).toBe("00:30");
    expect(time("13:00")).toBe("13:00");
    expect(time("anytime")).toBeNull();
  });

  it("picks a gallery-sized image", () => {
    expect(bestImageUrl({ "70px": { href: "a" }, "350px": { href: "b" } })).toBe("b");
  });
});

describe("toRoomOption", () => {
  const option = (changes: Partial<TripjackOption> = {}): TripjackOption => ({
    optionId: "opt-1",
    optionType: "SRSM",
    roomInfo: [{ id: "R1", name: "Deluxe, 1 King" }],
    inclusions: ["Airport transfer"],
    mealBasis: "Breakfast",
    pricing: { totalPrice: 9000, basePrice: 8000, discount: 0, taxes: 800, mf: 150, mft: 50, currency: "INR", strikethrough: 11000 },
    cancellation: {
      isRefundable: true,
      penalties: [
        { from: "2026-01-01T00:00:00", to: "2099-05-18T23:59:59", amount: 0 },
        { from: "2099-05-18T23:59:59", to: "2099-05-26T00:00:00", amount: 9000 },
      ],
    },
    ...changes,
  });

  it("maps price, meal plan and the free cancellation deadline", () => {
    vi.useFakeTimers({ now: new Date("2026-11-05T10:00:00Z") });
    const room = toRoomOption(option(), 2);
    vi.useRealTimers();
    expect(room).toMatchObject({
      id: "opt-1",
      roomTypeId: "R1",
      roomName: "Deluxe, 1 King",
      mealPlan: "Breakfast",
      freeCancellation: true,
      freeCancellationUntil: "2099-05-18T23:59:59",
      totalPrice: { amount: 9000, currency: "INR" },
      pricePerNight: { amount: 4500, currency: "INR" },
      strikethroughPrice: { amount: 11000, currency: "INR" },
      priceBreakup: { base: 8000, taxes: 800, managementFee: 150, managementFeeTax: 50, discount: 0 },
    });
  });

  it("is not free to cancel once the free window has passed", () => {
    const room = toRoomOption(option({ cancellation: { isRefundable: true, penalties: [{ from: "2020-01-01T00:00:00", to: "2020-02-01T00:00:00", amount: 0 }] } }), 1);
    expect(room.freeCancellation).toBe(false);
    expect(room.freeCancellationUntil).toBeNull();
    expect(toRoomOption(option({ mealBasis: "Room Only" }), 1).mealPlan).toBeNull();
  });
});
