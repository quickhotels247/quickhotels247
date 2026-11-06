import { ConflictException, Injectable } from "@nestjs/common";
import type { SavedHotel } from "@quickhotels/types/wishlist";
import type { SaveHotelDto } from "./dto/save-hotel.dto.js";
import { SavedHotelsRepository } from "./saved-hotels.repository.js";

export const MAX_SAVED_HOTELS = 200;

@Injectable()
export class SavedHotelsService {
  constructor(private readonly hotels: SavedHotelsRepository) {}

  list(userId: string): Promise<SavedHotel[]> {
    return this.hotels.list(userId);
  }

  async save(userId: string, hotelId: string, dto: SaveHotelDto): Promise<SavedHotel> {
    if (!(await this.hotels.exists(userId, hotelId)) && (await this.hotels.count(userId)) >= MAX_SAVED_HOTELS)
      throw new ConflictException(`You can save up to ${MAX_SAVED_HOTELS} hotels. Remove some to save more.`);
    return this.hotels.save(userId, hotelId, dto);
  }

  // Removing one that isn't saved is fine: the heart is already empty.
  remove(userId: string, hotelId: string): Promise<void> {
    return this.hotels.remove(userId, hotelId);
  }
}
