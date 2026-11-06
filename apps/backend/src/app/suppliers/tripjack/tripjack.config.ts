import { registerAs } from "@nestjs/config";

// TripJack connection settings, all from the backend's .env. The key never
// leaves the backend: it is sent only in requests to TripJack's own hosts.
export interface TripjackConfig {
  apiKey: string;
  // Hotel search and static content ("HMS") host.
  hmsBaseUrl: string;
  // Hotel review, booking and cancellation host.
  bookerBaseUrl: string;
  // Flights host (search, fare rules, review, booking). Production: https://tripjack.com
  airBaseUrl: string;
  // Header the key is sent in ("apikey" per TripJack's v3 docs).
  authHeader: string;
  timeoutMs: number;
  // Guest nationality sent with searches (TripJack countryId; 106 = India).
  nationalityId: string;
  currency: string;
  // How many of a region's hotels one search asks prices for (in batches of 100).
  searchMaxHotels: number;
  // Static content older than this is pulled again.
  contentMaxAgeMs: number;
}

// UAT hosts from TripJack's v3 docs (docs/tripjack/README.md). Production is
// https://hms-search.tripjack.com and https://hms-booker.tripjack.com, set in
// .env only after TripJack certifies the integration.
const UAT_HMS = "https://apitest-hms.tripjack.com";
const UAT_BOOKER = "https://apitest-hotel-booker.tripjack.com";

export const tripjackConfig = registerAs("tripjack", (): TripjackConfig => ({
  apiKey: process.env.TRIPJACK_API_KEY?.trim() ?? "",
  hmsBaseUrl: (process.env.TRIPJACK_HMS_BASE_URL || UAT_HMS).replace(/\/+$/, ""),
  bookerBaseUrl: (process.env.TRIPJACK_BOOKER_BASE_URL || UAT_BOOKER).replace(/\/+$/, ""),
  airBaseUrl: (process.env.TRIPJACK_AIR_BASE_URL || "https://apitest.tripjack.com").replace(/\/+$/, ""),
  authHeader: process.env.TRIPJACK_AUTH_HEADER || "apikey",
  timeoutMs: Number(process.env.TRIPJACK_TIMEOUT_MS ?? 20_000),
  nationalityId: process.env.TRIPJACK_NATIONALITY_ID || "106",
  currency: "INR",
  searchMaxHotels: Number(process.env.TRIPJACK_SEARCH_MAX_HOTELS ?? 300),
  contentMaxAgeMs: 7 * 24 * 60 * 60 * 1000,
}));
