import { Injectable } from "@nestjs/common";
import type { PricingRule, PricingRuleInput } from "@quickhotels/types/pricing";
import { PrismaService } from "../common/database/prisma.service.js";
import type { MarkupRule } from "./markup.js";

const toDate = (value: string | null) => (value ? new Date(value) : null);

@Injectable()
export class PricingRulesRepository {
  constructor(private readonly db: PrismaService) {}

  async active(): Promise<MarkupRule[]> {
    const rows = await this.db.pricingRule.findMany({ where: { status: "ACTIVE" } });
    return rows.map((row) => ({
      id: row.id,
      version: row.version,
      product: row.product,
      scope: row.scope,
      scopeValue: row.scopeValue,
      markupType: row.markupType,
      value: Number(row.value),
      priority: row.priority,
      validFrom: row.validFrom,
      validTo: row.validTo,
      updatedAt: row.updatedAt,
    }));
  }

  async list(): Promise<PricingRule[]> {
    const rows = await this.db.pricingRule.findMany({
      orderBy: [{ product: "asc" }, { priority: "desc" }, { updatedAt: "desc" }],
      include: { createdByAdmin: { select: { name: true } } },
    });
    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      product: row.product,
      scope: row.scope,
      scopeValue: row.scopeValue,
      markupType: row.markupType,
      value: Number(row.value),
      priority: row.priority,
      validFrom: row.validFrom?.toISOString() ?? null,
      validTo: row.validTo?.toISOString() ?? null,
      status: row.status,
      version: row.version,
      updatedAt: row.updatedAt.toISOString(),
      createdBy: row.createdByAdmin?.name ?? null,
    }));
  }

  private data(input: PricingRuleInput) {
    return {
      name: input.name,
      product: input.product,
      scope: input.scope,
      scopeValue: input.scope === "ALL" ? null : input.scopeValue,
      markupType: input.markupType,
      value: input.value,
      currency: input.markupType === "FIXED" ? "INR" : null,
      priority: input.priority,
      validFrom: toDate(input.validFrom),
      validTo: toDate(input.validTo),
      status: input.status,
    };
  }

  async create(input: PricingRuleInput, adminId: string): Promise<string> {
    const row = await this.db.pricingRule.create({ data: { ...this.data(input), createdByAdminId: adminId }, select: { id: true } });
    return row.id;
  }

  // Every change is a new version, so a booking can say which one it used.
  async update(id: string, input: PricingRuleInput): Promise<boolean> {
    const { count } = await this.db.pricingRule.updateMany({ where: { id }, data: { ...this.data(input), version: { increment: 1 } } });
    return count > 0;
  }

  async remove(id: string): Promise<boolean> {
    const { count } = await this.db.pricingRule.deleteMany({ where: { id } });
    return count > 0;
  }
}
