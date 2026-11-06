import { Injectable } from "@nestjs/common";
import type { FlightSearchCriteria } from "@quickhotels/types/flights";
import { PrismaService } from "../../../common/database/prisma.service.js";
import type { Prisma } from "../../../../generated/prisma/client.js";
import type { FlightTrip } from "../../../suppliers/flight-supplier.js";

export interface StoredFlightSearch {
  id: string;
  criteria: FlightSearchCriteria;
  supplier: string;
  trips: FlightTrip[];
  expiresAt: Date;
}

// A flight search and all its fares, served page by page until they expire.
@Injectable()
export class FlightSearchSessionsRepository {
  constructor(private readonly db: PrismaService) {}

  async create(search: Omit<StoredFlightSearch, "id"> & { userId: string | null }) {
    const row = await this.db.flightSearchSession.create({
      data: {
        userId: search.userId,
        criteria: search.criteria as unknown as Prisma.InputJsonValue,
        supplier: search.supplier,
        results: search.trips as unknown as Prisma.InputJsonValue,
        expiresAt: search.expiresAt,
      },
      select: { id: true },
    });
    return row.id;
  }

  async find(id: string): Promise<StoredFlightSearch | null> {
    const row = await this.db.flightSearchSession.findUnique({ where: { id } });
    return row
      ? {
          id: row.id,
          criteria: row.criteria as unknown as FlightSearchCriteria,
          supplier: row.supplier,
          trips: row.results as unknown as FlightTrip[],
          expiresAt: row.expiresAt,
        }
      : null;
  }
}
