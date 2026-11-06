import type { HotelImage, HotelRoomType, Money, RoomOption, TextSection } from "@quickhotels/types/hotels";
import { htmlToParagraphs } from "../../common/utils/html-text.js";
import type { HotelPageContent } from "../hotel-supplier.js";
import { toAmenities } from "./tripjack-amenities.js";
import type { TripjackHotelContent, TripjackImage, TripjackOption } from "./tripjack.types.js";

const MAX_IMAGES = 60;

// A large-but-not-original size for galleries; sizes vary per image.
const SIZE_PREFERENCE = ["1000px", "XXL", "XL", "original", "350px", "Standard", "200px", "70px"];
export function bestImageUrl(links: Record<string, { href: string }> | undefined): string | null {
  if (!links) return null;
  for (const size of SIZE_PREFERENCE) if (links[size]?.href) return links[size].href;
  return Object.values(links)[0]?.href ?? null;
}

function toImages(images: TripjackImage[] | undefined, limit = MAX_IMAGES): HotelImage[] {
  const seen = new Set<string>();
  const list = (images ?? []).flatMap((image) => {
    const url = bestImageUrl(image.links);
    if (!url || seen.has(url)) return [];
    seen.add(url);
    const caption = image.caption?.trim();
    return [{ url, caption: caption && caption !== "CoverImage" ? caption : null, hero: Boolean(image.is_hero_image ?? image.hero_image) }];
  });
  // The hero photo first.
  list.sort((a, b) => Number(b.hero) - Number(a.hero));
  return list.slice(0, limit).map(({ url, caption }) => ({ url, caption }));
}

const names = (map: Record<string, { name: string }> | undefined) =>
  [...new Set(Object.values(map ?? {}).map((item) => item.name.trim()).filter(Boolean))];

// Description keys in the order shown, with their titles.
const DESCRIPTION_TITLES: [string, string][] = [
  ["default", "About this property"],
  ["location", "Location"],
  ["rooms", "Rooms"],
  ["amenities", "Facilities"],
  ["dining", "Dining"],
  ["business_amenities", "For business travellers"],
  ["renovations", "Renovations"],
];

// `default` is sometimes a JSON string of named sections rather than HTML.
function descriptionSections(descriptions: Record<string, string | undefined> | undefined): TextSection[] {
  const raw: Record<string, string | undefined> = { ...(descriptions ?? {}) };
  if (raw.default?.trim().startsWith("{")) {
    try {
      const parsed = JSON.parse(raw.default) as Record<string, unknown>;
      delete raw.default;
      for (const [key, value] of Object.entries(parsed)) if (typeof value === "string" && !raw[key]) raw[key] = value;
    } catch {
      // Not JSON after all; shown as text.
    }
  }
  return DESCRIPTION_TITLES.flatMap(([key, title]) => {
    const paragraphs = htmlToParagraphs(raw[key]);
    return paragraphs.length ? [{ title, paragraphs }] : [];
  });
}

// "2:00 PM", "14:00" or "11:00 am" → "14:00" / "11:00"; null when unreadable.
export function time(value: string | undefined): string | null {
  const match = value?.trim().match(/^(\d{1,2}):(\d{2})\s*(am|pm)?/i);
  if (!match) return null;
  let hours = Number(match[1]);
  const half = match[3]?.toLowerCase();
  if (half === "pm" && hours < 12) hours += 12;
  if (half === "am" && hours === 12) hours = 0;
  return hours < 24 ? `${String(hours).padStart(2, "0")}:${match[2]}` : null;
}

// Policy fields are HTML, or sometimes a JSON object in a string
// ('{"Optional":"Airport shuttle fee…"}'). Returns its parts with their keys.
function policyParts(value: string | undefined): { key: string | null; html: string }[] {
  const text = value?.trim();
  if (!text) return [];
  if (text.startsWith("{")) {
    try {
      const parsed = JSON.parse(text) as Record<string, unknown>;
      return Object.entries(parsed).flatMap(([key, part]) => (typeof part === "string" ? [{ key, html: part }] : []));
    } catch {
      // Not JSON after all; shown as text.
    }
  }
  return [{ key: null, html: text }];
}

// Fee lists often arrive with their items run together ("…occupancy 7)Housekeeping is…"):
// start a new line where a sentence or bracket runs straight into a capital.
const splitRunTogether = (paragraph: string) => paragraph.split(/(?<=[a-z0-9.)])(?=[A-Z][a-z])/).map((part) => part.trim()).filter(Boolean);

function policySections(policies: TripjackHotelContent["policies"]): TextSection[] {
  const sections: [string, string | undefined][] = [
    // Fees paid at the hotel must be shown before booking (TripJack's rules).
    ["Fees paid at the property", policies?.mandatory_fees],
    ["Know before you go", policies?.know_before_you_go],
    ["Check-in instructions", policies?.instructions],
    ["Special instructions", policies?.special_instructions],
    ["Optional extras", policies?.optional_fees],
  ];
  const byTitle = new Map<string, string[]>();
  for (const [title, value] of sections) {
    for (const { key, html } of policyParts(value)) {
      // A part labelled optional is optional, whichever field it came in.
      const heading = key && /optional/i.test(key) ? "Optional extras" : title;
      const paragraphs = htmlToParagraphs(html).flatMap(splitRunTogether);
      if (paragraphs.length) byTitle.set(heading, [...(byTitle.get(heading) ?? []), ...paragraphs]);
    }
  }
  const order = sections.map(([title]) => title);
  const list = [...byTitle.entries()]
    .sort(([a], [b]) => order.indexOf(a) - order.indexOf(b))
    .map(([title, paragraphs]) => ({ title, paragraphs }));
  const rules = Object.entries(policies?.houseRules ?? {}).flatMap(([rule, text]) => {
    const body = htmlToParagraphs(text).join(" ");
    return body ? [`${rule.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase())}: ${body}`] : [];
  });
  if (rules.length) list.push({ title: "House rules", paragraphs: rules });
  return list;
}

function roomTypes(rooms: TripjackHotelContent["rooms"]): HotelRoomType[] {
  return Object.values(rooms ?? {}).flatMap((room) =>
    room?.id && room.name
      ? [
          {
            id: String(room.id),
            name: room.name.trim(),
            paragraphs: htmlToParagraphs(room.descriptions?.overview),
            beds: room.bed_config?.description?.trim() || null,
            areaSqM: room.area?.square_meters ? Math.round(room.area.square_meters) : null,
            maxGuests: room.occupancy?.max_allowed?.total ?? null,
            views: names(room.views),
            amenities: names(room.amenities),
            images: toImages(room.images, 12),
          },
        ]
      : [],
  );
}

export function contentToHotelPage(hotel: TripjackHotelContent): HotelPageContent {
  const times = hotel.policies?.checkInCheckOut;
  const minAge = Number(times?.checkin_min_age);
  const facilities = names(hotel.amenities);
  return {
    headline: hotel.descriptions?.headline?.trim() || null,
    images: toImages(hotel.images),
    description: descriptionSections(hotel.descriptions),
    facilities,
    amenities: toAmenities(facilities),
    checkIn: { from: time(times?.checkin_from), until: time(times?.checkin_till), minAge: Number.isFinite(minAge) && minAge > 0 ? minAge : null },
    checkOut: { from: time(times?.checkout_from), until: time(times?.checkout_till) },
    policies: policySections(hotel.policies),
    roomTypes: roomTypes(hotel.rooms),
  };
}

// ─── Pricing → room options ────────────────────────────────────────────────

const money = (amount: number, currency: string): Money => ({ amount: Math.round(amount * 100) / 100, currency });

// TripJack's penalty times are India time without a zone; compare them as such.
const indiaNow = () => new Date(Date.now() + 5.5 * 3600_000).toISOString().slice(0, 19);

export function toRoomOption(option: TripjackOption, nights: number): RoomOption {
  const { pricing } = option;
  const currency = pricing.currency || "INR";
  const roomNames = [...new Set(option.roomInfo.map((room) => room.name.trim()).filter(Boolean))];
  const penalties = option.cancellation?.penalties ?? [];
  const now = indiaNow();
  // Free until the end of the current (or next) slab that costs nothing.
  const freeSlab = option.cancellation?.isRefundable ? penalties.find((slab) => slab.amount === 0 && slab.to > now) : undefined;
  return {
    id: option.optionId,
    roomTypeId: option.roomInfo[0]?.id ? String(option.roomInfo[0].id) : null,
    roomName: roomNames.join(" + ") || "Room",
    mealPlan: option.mealBasis && option.mealBasis !== "Room Only" ? option.mealBasis : null,
    inclusions: (option.inclusions ?? []).map((item) => item.trim()).filter(Boolean),
    notes: htmlToParagraphs(option.bookingNotes).join("\n") || null,
    freeCancellation: Boolean(freeSlab),
    freeCancellationUntil: freeSlab?.to ?? null,
    cancellationCharges: penalties.map((slab) => ({ from: slab.from, to: slab.to, amount: money(slab.amount, currency) })),
    totalPrice: money(pricing.totalPrice, currency),
    pricePerNight: money(pricing.totalPrice / Math.max(1, nights), currency),
    strikethroughPrice: pricing.strikethrough && pricing.strikethrough > pricing.totalPrice ? money(pricing.strikethrough, currency) : null,
    priceBreakup: {
      base: pricing.basePrice,
      taxes: pricing.taxes,
      managementFee: pricing.mf,
      managementFeeTax: pricing.mft,
      discount: pricing.discount,
    },
    panRequired: option.compliance?.panRequired ?? false,
    passportRequired: option.compliance?.passportRequired ?? false,
  };
}
