import { Injectable } from "@nestjs/common";
import type { SavedTraveller, SavedTravellerInput, SavedTravellerTitle } from "@quickhotels/types/travellers";
import { PrismaService } from "../../../common/database/prisma.service.js";
import type { SavedTraveller as SavedTravellerRecord } from "../../../../generated/prisma/client.js";

const day = (value: Date | null) => (value ? value.toISOString().slice(0, 10) : null);
const toDate = (value: string | null | undefined) => (value ? new Date(`${value}T00:00:00Z`) : null);

function toTraveller(row: SavedTravellerRecord): SavedTraveller {
  return {
    id: row.id,
    title: row.title as SavedTravellerTitle,
    firstName: row.firstName,
    lastName: row.lastName,
    dateOfBirth: day(row.dateOfBirth),
    nationality: row.nationality,
    passportNumber: row.passportNumber,
    passportExpiry: day(row.passportExpiry),
    createdAt: row.createdAt.toISOString(),
  };
}

const toData = (input: SavedTravellerInput) => ({
  title: input.title,
  firstName: input.firstName,
  lastName: input.lastName,
  dateOfBirth: toDate(input.dateOfBirth),
  nationality: input.nationality ?? null,
  passportNumber: input.passportNumber ?? null,
  passportExpiry: toDate(input.passportExpiry),
});

// Every query is scoped to the owner, so one customer can't reach another's travellers.
@Injectable()
export class TravellersRepository {
  constructor(private readonly db: PrismaService) {}

  async list(userId: string): Promise<SavedTraveller[]> {
    const rows = await this.db.savedTraveller.findMany({ where: { userId }, orderBy: [{ firstName: "asc" }, { createdAt: "asc" }] });
    return rows.map(toTraveller);
  }

  count(userId: string): Promise<number> {
    return this.db.savedTraveller.count({ where: { userId } });
  }

  async create(userId: string, input: SavedTravellerInput): Promise<SavedTraveller> {
    return toTraveller(await this.db.savedTraveller.create({ data: { userId, ...toData(input) } }));
  }

  async update(userId: string, id: string, input: SavedTravellerInput): Promise<SavedTraveller | null> {
    const { count } = await this.db.savedTraveller.updateMany({ where: { id, userId }, data: toData(input) });
    if (!count) return null;
    const row = await this.db.savedTraveller.findUnique({ where: { id } });
    return row ? toTraveller(row) : null;
  }

  async remove(userId: string, id: string): Promise<boolean> {
    const { count } = await this.db.savedTraveller.deleteMany({ where: { id, userId } });
    return count > 0;
  }
}
