import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../common/database/prisma.service.js";

export interface FareDay {
  from: string;
  to: string;
  date: string; // YYYY-MM-DD
  cabin: string;
  amount: number;
  currency: string;
}

const day = (value: string) => new Date(`${value}T00:00:00Z`);

// The cheapest fare per route, day and cabin from recent searches.
@Injectable()
export class FareCalendarRepository {
  constructor(private readonly db: PrismaService) {}

  // The latest search's cheapest fare replaces the old one (fares move both ways).
  async save(fares: FareDay[]) {
    for (const fare of fares) {
      const key = { fromCode: fare.from, toCode: fare.to, cabin: fare.cabin, date: day(fare.date) };
      await this.db.flightFareDay.upsert({
        where: { fromCode_toCode_cabin_date: key },
        create: { ...key, amount: fare.amount, currency: fare.currency },
        update: { amount: fare.amount, currency: fare.currency, updatedAt: new Date() },
      });
    }
  }

  async range(from: string, to: string, cabin: string, start: string, end: string, freshSince: Date) {
    const rows = await this.db.flightFareDay.findMany({
      where: { fromCode: from, toCode: to, cabin, date: { gte: day(start), lte: day(end) }, updatedAt: { gte: freshSince } },
      orderBy: { date: "asc" },
    });
    return rows.map((row) => ({ date: row.date.toISOString().slice(0, 10), amount: Number(row.amount), currency: row.currency }));
  }
}
