import { Injectable } from "@nestjs/common";
import type { Promotion, PromotionInput } from "@quickhotels/types/pricing";
import { PrismaService } from "../common/database/prisma.service.js";
import { pickPromotion, type ActivePromotion } from "./promotions.js";

// India days → the start of the first and the end of the last.
const startOf = (day: string | null) => (day ? new Date(`${day.slice(0, 10)}T00:00:00+05:30`) : null);
const endOf = (day: string | null) => (day ? new Date(`${day.slice(0, 10)}T23:59:59+05:30`) : null);
const indiaDay = (date: Date | null) => (date ? new Date(date.getTime() + 330 * 60_000).toISOString().slice(0, 10) : null);
const num = (value: { toString(): string } | null) => (value === null ? null : Number(value));

@Injectable()
export class PromotionsRepository {
  constructor(private readonly db: PrismaService) {}

  async active(): Promise<ActivePromotion[]> {
    const rows = await this.db.promotion.findMany({ where: { status: "ACTIVE" } });
    return rows.map((row) => ({
      id: row.id,
      version: row.version,
      name: row.name,
      discountType: row.discountType,
      value: Number(row.value),
      maxDiscount: num(row.maxDiscount),
      validFrom: row.validFrom,
      validTo: row.validTo,
      updatedAt: row.updatedAt,
    }));
  }

  async list(): Promise<Promotion[]> {
    const rows = await this.db.promotion.findMany({ orderBy: [{ status: "asc" }, { updatedAt: "desc" }], include: { createdByAdmin: { select: { name: true } } } });
    const running = pickPromotion(await this.active());
    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      discountType: row.discountType,
      value: Number(row.value),
      maxDiscount: num(row.maxDiscount),
      validFrom: indiaDay(row.validFrom),
      validTo: indiaDay(row.validTo),
      status: row.status,
      version: row.version,
      updatedAt: row.updatedAt.toISOString(),
      createdBy: row.createdByAdmin?.name ?? null,
      live: running?.id === row.id,
    }));
  }

  private data(input: PromotionInput) {
    return {
      name: input.name,
      discountType: input.discountType,
      value: input.value,
      maxDiscount: input.discountType === "PERCENTAGE" ? input.maxDiscount : null,
      validFrom: startOf(input.validFrom),
      validTo: endOf(input.validTo),
      status: input.status,
    };
  }

  async create(input: PromotionInput, adminId: string): Promise<string> {
    return (await this.db.promotion.create({ data: { ...this.data(input), createdByAdminId: adminId }, select: { id: true } })).id;
  }

  // Every change is a new version; each checkout records the one it used.
  async update(id: string, input: PromotionInput): Promise<boolean> {
    const { count } = await this.db.promotion.updateMany({ where: { id }, data: { ...this.data(input), version: { increment: 1 } } });
    return count > 0;
  }

  async remove(id: string): Promise<boolean> {
    const { count } = await this.db.promotion.deleteMany({ where: { id } });
    return count > 0;
  }
}
