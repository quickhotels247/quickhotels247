import { BadRequestException, ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import type { Coupon } from "@quickhotels/types/coupons";
import { CouponsRepository } from "../../coupons/coupons.repository.js";
import { AuditLogRepository } from "../audit-log.repository.js";
import type { CouponDto } from "./dto/coupon.dto.js";

const MAX_PERCENT = 90;
const UNIQUE_VIOLATION = "P2002";

function check(dto: CouponDto) {
  if (dto.discountType === "PERCENTAGE" && dto.value > MAX_PERCENT) throw new BadRequestException(`Percentages can be at most ${MAX_PERCENT}%.`);
  if (dto.validTo < dto.validFrom) throw new BadRequestException("The end date can't be before the start date.");
  if (dto.public && !dto.title) throw new BadRequestException("Give a title to show the coupon on the Home page.");
  if (dto.product === "FLIGHT" && dto.eligibleDestinations.length) throw new BadRequestException("Destinations only apply to hotel coupons.");
}

const sameCode = (error: unknown) => {
  if ((error as { code?: string }).code === UNIQUE_VIOLATION) throw new ConflictException("Another coupon already uses this code.");
  throw error;
};

@Injectable()
export class AdminCouponsService {
  constructor(
    private readonly coupons: CouponsRepository,
    private readonly audit: AuditLogRepository,
  ) {}

  list(): Promise<Coupon[]> {
    return this.coupons.list();
  }

  async create(dto: CouponDto, adminId: string): Promise<Coupon[]> {
    check(dto);
    const id = await this.coupons.create(dto, adminId).catch(sameCode);
    await this.audit.record(adminId, "coupon.create", id, { code: dto.code, status: dto.status });
    return this.coupons.list();
  }

  async update(id: string, dto: CouponDto, adminId: string): Promise<Coupon[]> {
    check(dto);
    if (!(await this.coupons.update(id, dto).catch(sameCode))) throw new NotFoundException("That coupon no longer exists.");
    await this.audit.record(adminId, "coupon.update", id, { code: dto.code, status: dto.status });
    return this.coupons.list();
  }

  async remove(id: string, adminId: string): Promise<Coupon[]> {
    const result = await this.coupons.remove(id);
    if (result === "missing") throw new NotFoundException("That coupon no longer exists.");
    if (result === "used") throw new ConflictException("This coupon has been used on bookings, so it can't be deleted. Set it to Off instead.");
    await this.audit.record(adminId, "coupon.delete", id);
    return this.coupons.list();
  }
}
