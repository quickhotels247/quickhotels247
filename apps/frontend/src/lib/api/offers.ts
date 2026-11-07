import type { PublicOffer } from "@quickhotels/types/coupons";
import { apiRequest } from "./client";

// Public coupons for the Home page Offers.
export const offersApi = {
  list: (signal?: AbortSignal) => apiRequest<PublicOffer[]>("/v1/offers", { signal }),
};
