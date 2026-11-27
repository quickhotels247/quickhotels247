import type { PricingRuleStatus, PromotionInput } from "@quickhotels/types/pricing";
import { Transform } from "class-transformer";
import { IsIn, IsNumber, IsOptional, IsString, Matches, Max, Min, ValidateIf } from "class-validator";

const trimOrNull = ({ value }: { value: unknown }) => (typeof value === "string" ? value.trim() || null : value);

export class PromotionDto implements PromotionInput {
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  @IsString()
  @Matches(/^.{2,60}$/, { message: "Give the promotion a name customers can see (2–60 characters), e.g. Winter sale." })
  name: string;

  @IsIn(["PERCENTAGE", "FIXED"])
  discountType: "PERCENTAGE" | "FIXED";

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(1, { message: "The discount must be at least 1." })
  @Max(100_000)
  value: number;

  @ValidateIf((dto: PromotionDto) => dto.maxDiscount !== null && dto.maxDiscount !== undefined)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(1)
  maxDiscount: number | null;

  @IsOptional()
  @Transform(trimOrNull)
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: "Dates look like 2026-12-01." })
  validFrom: string | null;

  @IsOptional()
  @Transform(trimOrNull)
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: "Dates look like 2026-12-31." })
  validTo: string | null;

  @IsIn(["DRAFT", "ACTIVE", "INACTIVE"])
  status: PricingRuleStatus;
}
