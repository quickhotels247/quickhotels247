import { Transform, Type } from "class-transformer";
import { IsIn, IsInt, IsOptional, Matches, Max, Min } from "class-validator";
import type { CabinClass } from "@quickhotels/types/flights";

const upper = ({ value }: { value: unknown }) => (typeof value === "string" ? value.trim().toUpperCase() : value);

// GET /api/v1/flights/fare-calendar?from=HYD&to=CCU&cabin=economy&start=2026-12-01&days=62
export class FareCalendarQueryDto {
  @Transform(upper)
  @Matches(/^[A-Z]{3}$/, { message: "from must be a 3-letter airport code." })
  from!: string;

  @Transform(upper)
  @Matches(/^[A-Z]{3}$/, { message: "to must be a 3-letter airport code." })
  to!: string;

  @IsOptional()
  @IsIn(["economy", "premiumEconomy", "business", "first"])
  cabin: CabinClass = "economy";

  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: "start must be a date like 2026-12-01." })
  start!: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(62)
  days = 62;
}
