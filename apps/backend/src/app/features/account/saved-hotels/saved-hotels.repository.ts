import { Injectable } from "@nestjs/common";
import type { SavedHotel, SaveHotelRequest } from "@quickhotels/types/wishlist";
import { PrismaService } from "../../../common/database/prisma.service.js";
import type { SavedHotel as SavedHotelRecord } from "../../../../generated/prisma/client.js";

const toSaved = (row: SavedHotelRecord): SavedHotel => ({
  hotelId: row.hotelId,
  name: row.name,
  city: row.city,
  country: row.country,
  imageUrl: row.imageUrl,
  starRating: row.starRating,
  savedAt: row.createdAt.toISOString(),
});

@Injectable()
export class SavedHotelsRepository {
  constructor(private readonly db: PrismaService) {}

  async list(userId: string): Promise<SavedHotel[]> {
    const rows = await this.db.savedHotel.findMany({ where: { userId }, orderBy: { createdAt: "desc" } });
    return rows.map(toSaved);
  }

  count(userId: string): Promise<number> {
    return this.db.savedHotel.count({ where: { userId } });
  }

  async exists(userId: string, hotelId: string): Promise<boolean> {
    return Boolean(await this.db.savedHotel.findUnique({ where: { userId_hotelId: { userId, hotelId } }, select: { id: true } }));
  }

  // Saving again refreshes the snapshot (name, photo) and keeps the date.
  async save(userId: string, hotelId: string, hotel: SaveHotelRequest): Promise<SavedHotel> {
    const data = { name: hotel.name, city: hotel.city ?? null, country: hotel.country ?? null, imageUrl: hotel.imageUrl ?? null, starRating: hotel.starRating ?? null };
    return toSaved(await this.db.savedHotel.upsert({ where: { userId_hotelId: { userId, hotelId } }, create: { userId, hotelId, ...data }, update: data }));
  }

  async remove(userId: string, hotelId: string): Promise<void> {
    await this.db.savedHotel.deleteMany({ where: { userId, hotelId } });
  }
}
