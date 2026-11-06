import { flightImages } from "./images";
import type { PopularRoute } from "./types";

// Routes shown under "Popular flights near you". Keep in step with the
// backend's POPULAR_ROUTES: fares and dates load live from
// GET /api/v1/flights/popular-routes.
export const popularRoutes: PopularRoute[] = [
  { id: "bom-dxb", scope: "international", from: "BOM", to: "DXB", imageUrl: flightImages.dubai },
  { id: "del-bkk", scope: "international", from: "DEL", to: "BKK", imageUrl: flightImages.bangkok },
  { id: "blr-sin", scope: "international", from: "BLR", to: "SIN", imageUrl: flightImages.singapore },
  { id: "del-lhr", scope: "international", from: "DEL", to: "LHR", imageUrl: flightImages.london },
  { id: "bom-dps", scope: "international", from: "BOM", to: "DPS", imageUrl: flightImages.bali },
  { id: "del-goi", scope: "domestic", from: "DEL", to: "GOI", imageUrl: flightImages.goa },
  { id: "bom-del", scope: "domestic", from: "BOM", to: "DEL", imageUrl: flightImages.delhi },
  { id: "blr-bom", scope: "domestic", from: "BLR", to: "BOM", imageUrl: flightImages.mumbai },
  { id: "del-jai", scope: "domestic", from: "DEL", to: "JAI", imageUrl: flightImages.jaipur },
  { id: "hyd-cok", scope: "domestic", from: "HYD", to: "COK", imageUrl: flightImages.kerala },
];
