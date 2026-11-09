import type { FlightBookingsTab } from "@quickhotels/types/flight-checkout";
import { Transform } from "class-transformer";
import { IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min } from "class-validator";

export class FlightBookingsQueryDto {
  @IsOptional()
  @IsIn(["upcoming", "past", "cancelled"])
  tab: FlightBookingsTab = "upcoming";

  @IsOptional()
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  @IsString()
  @MaxLength(60)
  q: string = "";

  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  @Max(100)
  page: number = 1;
}

export class BookingLinkQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(64)
  t?: string;
}
