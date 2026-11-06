import { Transform, Type } from "class-transformer";
import { IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min } from "class-validator";
import type { BookingsTab } from "@quickhotels/types/bookings";
import { BOOKINGS_TABS } from "../booking-status.js";

// Query of GET /api/v1/bookings.
export class BookingsQueryDto {
  @IsOptional()
  @IsIn(BOOKINGS_TABS)
  tab: BookingsTab = "upcoming";

  // Part of a booking reference or hotel name.
  @IsOptional()
  @Transform(({ value }: { value: unknown }) => (typeof value === "string" ? value.trim() : value))
  @IsString()
  @MaxLength(60)
  q?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(500)
  page: number = 1;
}
