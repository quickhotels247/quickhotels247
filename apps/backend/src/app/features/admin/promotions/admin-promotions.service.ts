import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import type { Promotion } from "@quickhotels/types/pricing";
import { PricingService } from "../../../pricing/pricing.service.js";
import { PromotionsRepository } from "../../../pricing/promotions.repository.js";
import { AuditLogRepository } from "../audit-log.repository.js";
import type { PromotionDto } from "./dto/promotion.dto.js";

const MAX_PERCENT = 90;

function check(dto: PromotionDto) {
  if (dto.discountType === "PERCENTAGE" && dto.value > MAX_PERCENT) throw new BadRequestException(`Percentages can be at most ${MAX_PERCENT}%.`);
  if (dto.validFrom && dto.validTo && dto.validTo < dto.validFrom) throw new BadRequestException("The end date can't be before the start date.");
}

const what = (dto: PromotionDto) => `${dto.value}${dto.discountType === "PERCENTAGE" ? "%" : " INR"} off`;

// Automatic hotel discounts (admin → Promotions). Saved changes reach new
// searches at once (the pricing cache is cleared).
@Injectable()
export class AdminPromotionsService {
  constructor(
    private readonly promotions: PromotionsRepository,
    private readonly pricing: PricingService,
    private readonly audit: AuditLogRepository,
  ) {}

  list(): Promise<Promotion[]> {
    return this.promotions.list();
  }

  async create(dto: PromotionDto, adminId: string): Promise<Promotion[]> {
    check(dto);
    const id = await this.promotions.create(dto, adminId);
    this.pricing.invalidate();
    await this.audit.record(adminId, "promotion.create", id, { name: dto.name, discount: what(dto), status: dto.status });
    return this.promotions.list();
  }

  async update(id: string, dto: PromotionDto, adminId: string): Promise<Promotion[]> {
    check(dto);
    if (!(await this.promotions.update(id, dto))) throw new NotFoundException("That promotion no longer exists.");
    this.pricing.invalidate();
    await this.audit.record(adminId, "promotion.update", id, { name: dto.name, discount: what(dto), status: dto.status });
    return this.promotions.list();
  }

  async remove(id: string, adminId: string): Promise<Promotion[]> {
    if (!(await this.promotions.remove(id))) throw new NotFoundException("That promotion no longer exists.");
    this.pricing.invalidate();
    await this.audit.record(adminId, "promotion.delete", id);
    return this.promotions.list();
  }
}
