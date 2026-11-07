import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import type { PricingRule } from "@quickhotels/types/pricing";
import { PricingRulesRepository } from "../../../pricing/pricing-rules.repository.js";
import { PricingService } from "../../../pricing/pricing.service.js";
import { AuditLogRepository } from "../audit-log.repository.js";
import type { PricingRuleDto } from "./dto/pricing-rule.dto.js";

// Percentages above this are almost certainly a typo (e.g. 150 for 15).
const MAX_PERCENT = 50;

function check(dto: PricingRuleDto) {
  if (dto.markupType === "PERCENTAGE" && dto.value > MAX_PERCENT) throw new BadRequestException(`Percentages can be at most ${MAX_PERCENT}%.`);
  if (dto.product === "HOTEL" && dto.scope === "AIRLINE") throw new BadRequestException("Hotel rules can be for all hotels, a country or a destination.");
  if (dto.product === "FLIGHT" && (dto.scope === "COUNTRY" || dto.scope === "DESTINATION")) throw new BadRequestException("Flight rules can be for all flights or one airline.");
  if (dto.scope === "AIRLINE" && !/^[A-Z0-9]{2,3}$/i.test(dto.scopeValue ?? "")) throw new BadRequestException("Use the airline's 2-letter code, e.g. 6E or AI.");
  if (dto.validFrom && dto.validTo && dto.validTo < dto.validFrom) throw new BadRequestException("The end date can't be before the start date.");
}

const normalise = (dto: PricingRuleDto): PricingRuleDto => ({ ...dto, scopeValue: dto.scope === "AIRLINE" ? (dto.scopeValue ?? "").toUpperCase() : dto.scopeValue });

@Injectable()
export class AdminPricingService {
  constructor(
    private readonly rules: PricingRulesRepository,
    private readonly pricing: PricingService,
    private readonly audit: AuditLogRepository,
  ) {}

  list(): Promise<PricingRule[]> {
    return this.rules.list();
  }

  async create(dto: PricingRuleDto, adminId: string): Promise<PricingRule[]> {
    check(dto);
    const id = await this.rules.create(normalise(dto), adminId);
    this.pricing.invalidate();
    await this.audit.record(adminId, "pricing.create", id, { name: dto.name, product: dto.product, markup: `${dto.value}${dto.markupType === "PERCENTAGE" ? "%" : " INR"}`, status: dto.status });
    return this.rules.list();
  }

  async update(id: string, dto: PricingRuleDto, adminId: string): Promise<PricingRule[]> {
    check(dto);
    if (!(await this.rules.update(id, normalise(dto)))) throw new NotFoundException("That rule no longer exists.");
    this.pricing.invalidate();
    await this.audit.record(adminId, "pricing.update", id, { name: dto.name, markup: `${dto.value}${dto.markupType === "PERCENTAGE" ? "%" : " INR"}`, status: dto.status });
    return this.rules.list();
  }

  async remove(id: string, adminId: string): Promise<PricingRule[]> {
    if (!(await this.rules.remove(id))) throw new NotFoundException("That rule no longer exists.");
    this.pricing.invalidate();
    await this.audit.record(adminId, "pricing.delete", id);
    return this.rules.list();
  }
}
