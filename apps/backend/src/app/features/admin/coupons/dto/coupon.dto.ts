import type { CouponInput, CouponStatus } from "@quickhotels/types/coupons";
import type { PricingProduct } from "@quickhotels/types/pricing";
import { Transform } from "class-transformer";
import { ArrayMaxSize, IsArray, IsBoolean, IsIn, IsInt, IsNumber, IsOptional, IsString, Matches, Max, MaxLength, Min } from "class-validator";

const trimOrNull = ({ value }: { value: unknown }) => (typeof value === "string" ? value.trim() || null : value);
const DATE = /^\d{4}-\d{2}-\d{2}$/;

export class CouponDto implements CouponInput {
  @Transform(({ value }) => (typeof value === "string" ? value.trim().toUpperCase() : value))
  @Matches(/^[A-Z0-9]{3,20}$/, { message: "Codes have 3–20 letters and numbers, e.g. GOA500." })
  code: string;

  @IsOptional()
  @Transform(trimOrNull)
  @IsString()
  @MaxLength(80)
  title: string | null;

  @IsOptional()
  @Transform(trimOrNull)
  @IsString()
  @MaxLength(300)
  description: string | null;

  @IsOptional()
  @IsIn(["HOTEL", "FLIGHT", null])
  product: PricingProduct | null;

  @IsIn(["PERCENTAGE", "FIXED"])
  discountType: "PERCENTAGE" | "FIXED";

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(1)
  @Max(1_000_000)
  value: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(1)
  maxDiscount: number | null;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  minBookingAmount: number | null;

  @Matches(DATE, { message: "Dates look like 2026-12-01." })
  validFrom: string;

  @Matches(DATE, { message: "Dates look like 2026-12-31." })
  validTo: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  usageLimit: number | null;

  @IsOptional()
  @IsInt()
  @Min(1)
  perUserLimit: number | null;

  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  @Transform(({ value }) => (Array.isArray(value) ? value.map((item) => String(item).trim()).filter(Boolean) : value))
  eligibleDestinations: string[];

  @IsBoolean()
  public: boolean;

  @IsIn(["DRAFT", "ACTIVE", "INACTIVE"])
  status: CouponStatus;
}
