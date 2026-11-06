import { registerAs } from "@nestjs/config";

export type HotelSupplierName = "mock" | "tripjack";

export interface SuppliersConfig {
  // Which hotel supplier the app uses. "mock" serves sample hotels for
  // development and is refused in production (see production-env.ts).
  hotelSupplier: HotelSupplierName;
}

export const suppliersConfig = registerAs("suppliers", (): SuppliersConfig => ({
  hotelSupplier: process.env.HOTEL_SUPPLIER === "tripjack" ? "tripjack" : "mock",
}));
