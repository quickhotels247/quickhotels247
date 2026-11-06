import { BadRequestException, ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import type { SavedTraveller } from "@quickhotels/types/travellers";
import type { SavedTravellerDto } from "./dto/saved-traveller.dto.js";
import { TravellersRepository } from "./travellers.repository.js";

export const MAX_SAVED_TRAVELLERS = 20;

function checkDates(dto: SavedTravellerDto) {
  const today = new Date().toISOString().slice(0, 10);
  if (dto.dateOfBirth && (dto.dateOfBirth >= today || dto.dateOfBirth < "1900-01-01")) throw new BadRequestException("Check the date of birth.");
  if (dto.passportExpiry && dto.passportExpiry < today) throw new BadRequestException("This passport has expired.");
  if (dto.passportExpiry && !dto.passportNumber) throw new BadRequestException("Add the passport number with its expiry date.");
}

@Injectable()
export class TravellersService {
  constructor(private readonly travellers: TravellersRepository) {}

  list(userId: string): Promise<SavedTraveller[]> {
    return this.travellers.list(userId);
  }

  async create(userId: string, dto: SavedTravellerDto): Promise<SavedTraveller> {
    checkDates(dto);
    if ((await this.travellers.count(userId)) >= MAX_SAVED_TRAVELLERS)
      throw new ConflictException(`You can save up to ${MAX_SAVED_TRAVELLERS} travellers. Remove one to add another.`);
    return this.travellers.create(userId, dto);
  }

  async update(userId: string, id: string, dto: SavedTravellerDto): Promise<SavedTraveller> {
    checkDates(dto);
    const saved = await this.travellers.update(userId, id, dto);
    if (!saved) throw new NotFoundException("This traveller was not found.");
    return saved;
  }

  async remove(userId: string, id: string): Promise<void> {
    if (!(await this.travellers.remove(userId, id))) throw new NotFoundException("This traveller was not found.");
  }
}
