import { Injectable } from "@nestjs/common";
import type { HotelSearchRequest, HotelSearchResult, SearchCentre } from "@quickhotels/types/hotels";
import { PrismaService } from "../../common/database/prisma.service.js";
import { Prisma } from "../../../generated/prisma/client.js";

export interface NewSearchSession {
  request: HotelSearchRequest;
  userId: string | null;
  supplier: string;
  supplierSearchId: string | null;
  supplierContext: unknown;
  results: HotelSearchResult[];
  nextCursor: unknown;
  centre: SearchCentre | null;
  expiresAt: Date;
}

export interface StoredSearch {
  id: string;
  request: HotelSearchRequest;
  supplier: string;
  supplierContext: unknown;
  results: HotelSearchResult[];
  nextCursor: unknown;
  centre: SearchCentre | null;
  expiresAt: Date;
}

const json = (value: unknown) => (value == null ? Prisma.DbNull : (value as Prisma.InputJsonValue));

// Each customer search and the hotels priced for it so far, so booking
// attempts can point back to it (spec §8) and later pages don't re-price
// everything. Rates are only good until expiresAt.
@Injectable()
export class SearchSessionsRepository {
  constructor(private readonly db: PrismaService) {}

  async create(session: NewSearchSession) {
    const { request } = session;
    const row = await this.db.searchSession.create({
      data: {
        userId: session.userId,
        destination: request.destination,
        checkIn: new Date(`${request.checkIn}T00:00:00Z`),
        checkOut: new Date(`${request.checkOut}T00:00:00Z`),
        occupancy: {
          rooms: request.rooms,
          adults: request.adults,
          children: request.children,
          childAges: request.childAges ?? [],
        },
        supplier: session.supplier,
        supplierSearchId: session.supplierSearchId,
        supplierContext: json(session.supplierContext),
        results: json(session.results),
        nextCursor: json(session.nextCursor),
        centre: json(session.centre),
        expiresAt: session.expiresAt,
      },
      select: { id: true },
    });
    return row.id;
  }

  async find(id: string): Promise<StoredSearch | null> {
    const row = await this.db.searchSession.findUnique({ where: { id } });
    if (!row) return null;
    const occupancy = row.occupancy as { rooms: number; adults: number; children: number; childAges: number[] };
    return {
      id: row.id,
      request: {
        destination: row.destination,
        checkIn: row.checkIn.toISOString().slice(0, 10),
        checkOut: row.checkOut.toISOString().slice(0, 10),
        rooms: occupancy.rooms,
        adults: occupancy.adults,
        children: occupancy.children,
        ...(occupancy.childAges.length ? { childAges: occupancy.childAges } : {}),
      },
      supplier: row.supplier,
      supplierContext: row.supplierContext,
      results: (row.results as HotelSearchResult[] | null) ?? [],
      nextCursor: row.nextCursor,
      centre: (row.centre as SearchCentre | null) ?? null,
      expiresAt: row.expiresAt,
    };
  }

  async saveMore(id: string, results: HotelSearchResult[], nextCursor: unknown, supplierContext: unknown) {
    await this.db.searchSession.update({
      where: { id },
      data: { results: json(results), nextCursor: json(nextCursor), supplierContext: json(supplierContext) },
    });
  }
}
