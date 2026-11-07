import type { MarkupType, PricingProduct, PricingRuleInput, PricingRuleStatus, PricingScope } from "@quickhotels/types/pricing";
import { Transform } from "class-transformer";
import { IsIn, IsInt, IsNumber, IsOptional, IsString, Matches, Max, MaxLength, Min, ValidateIf } from "class-validator";

const trimOrNull = ({ value }: { value: unknown }) => (typeof value === "string" ? value.trim() || null : value);

export class PricingRuleDto implements PricingRuleInput {
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  @IsString()
  @Matches(/^.{2,80}$/, { message: "Give the rule a name (2–80 characters)." })
  name: string;

  @IsIn(["HOTEL", "FLIGHT"])
  product: PricingProduct;

  @IsIn(["ALL", "COUNTRY", "DESTINATION", "AIRLINE"])
  scope: PricingScope;

  // Required unless the scope is ALL: a country, destination or airline code.
  @ValidateIf((rule: PricingRuleDto) => rule.scope !== "ALL")
  @Transform(trimOrNull)
  @IsString({ message: "Say which country, destination or airline this rule is for." })
  @MaxLength(80)
  scopeValue: string | null;

  @IsIn(["PERCENTAGE", "FIXED"])
  markupType: MarkupType;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100_000)
  value: number;

  @IsInt()
  @Min(-100)
  @Max(100)
  priority: number;

  @IsOptional()
  @Transform(trimOrNull)
  @Matches(/^\d{4}-\d{2}-\d{2}(T.*)?$/, { message: "Dates look like 2026-12-01." })
  validFrom: string | null;

  @IsOptional()
  @Transform(trimOrNull)
  @Matches(/^\d{4}-\d{2}-\d{2}(T.*)?$/, { message: "Dates look like 2026-12-31." })
  validTo: string | null;

  @IsIn(["DRAFT", "ACTIVE", "INACTIVE"])
  status: PricingRuleStatus;
}
