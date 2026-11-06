import { Injectable } from "@nestjs/common";
import type { HotelImage } from "@quickhotels/types/hotels";
import { PrismaService } from "../../common/database/prisma.service.js";
import { Prisma } from "../../../generated/prisma/client.js";
import type { HotelPageContent } from "../../suppliers/hotel-supplier.js";

export interface StoredHotel {
  id: string;
  supplier: string;
  supplierHotelId: string;
  name: string;
  isActive: boolean;
  starRating: number | null;
  propertyType: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  latitude: number | null;
  longitude: number | null;
  heroImageUrl: string | null;
  // From the search-time content cache.
  headline: string | null;
  facilities: string[];
  images: HotelImage[];
  // The hotel page's full content, once fetched.
  page: HotelPageContent | null;
  pageFetchedAt: Date | null;
}

const LANGUAGE = "en";
const strings = (value: unknown) => (Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : []);

// Hotels and their content for the hotel page.
@Injectable()
export class HotelPageRepository {
  constructor(private readonly db: PrismaService) {}

  async find(id: string): Promise<StoredHotel | null> {
    const row = await this.db.hotel.findUnique({
      where: { id },
      include: { content: { where: { language: LANGUAGE }, take: 1 } },
    });
    if (!row) return null;
    const content = row.content[0];
    return {
      id: row.id,
      supplier: row.supplier,
      supplierHotelId: row.supplierHotelId,
      name: row.name,
      isActive: row.isActive,
      starRating: row.starRating === null ? null : Number(row.starRating),
      propertyType: row.propertyType,
      address: row.address,
      city: row.city,
      country: row.country,
      latitude: row.latitude === null ? null : Number(row.latitude),
      longitude: row.longitude === null ? null : Number(row.longitude),
      heroImageUrl: row.heroImageUrl,
      headline: content?.description ?? null,
      facilities: strings(content?.facilities),
      images: Array.isArray(content?.images) ? (content.images as unknown as HotelImage[]) : [],
      page: (content?.details as HotelPageContent | null | undefined) ?? null,
      pageFetchedAt: content?.detailsFetchedAt ?? null,
    };
  }

  async savePage(hotelId: string, page: HotelPageContent) {
    const details = page as unknown as Prisma.InputJsonValue;
    await this.db.hotelContentCache.upsert({
      where: { hotelId_language: { hotelId, language: LANGUAGE } },
      create: { hotelId, language: LANGUAGE, description: page.headline, facilities: page.facilities, images: page.images as unknown as Prisma.InputJsonValue, details, detailsFetchedAt: new Date() },
      update: { details, detailsFetchedAt: new Date() },
    });
  }
}
