import type { HotelDetails } from "@quickhotels/types/hotels";

const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080").replace(/\/+$/, "");

// The hotel's content for its page title, preview and structured data, read
// on the server. Cached an hour; null if the backend can't answer (the page
// still works, with generic metadata).
export async function hotelForSeo(id: string): Promise<HotelDetails | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  try {
    const response = await fetch(`${API_URL}/api/v1/hotels/${id}`, { next: { revalidate: 3600 }, signal: AbortSignal.timeout(5000) });
    return response.ok ? ((await response.json()) as HotelDetails) : null;
  } catch {
    return null;
  }
}

// One-line description: what, where, and the first sentence of the overview.
export function hotelDescription(hotel: HotelDetails) {
  const kind = [hotel.starRating ? `${hotel.starRating}-star` : null, (hotel.propertyType ?? "hotel").toLowerCase()].filter(Boolean).join(" ");
  const place = [hotel.city, hotel.country].filter(Boolean).join(", ");
  const overview = hotel.description[0]?.paragraphs[0]?.split(/(?<=\.)\s/)[0] ?? "";
  return `${hotel.name}: ${kind}${place ? ` in ${place}` : ""}. ${overview} See photos, facilities and live room prices.`.replace(/\s+/g, " ").trim().slice(0, 300);
}
