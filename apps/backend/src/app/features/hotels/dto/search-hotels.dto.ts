import { Transform } from "class-transformer";
import {
  ArrayMaxSize,
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
} from "class-validator";
import type { HotelSearchRequest } from "@quickhotels/types/hotels";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

// Body of POST /api/v1/searches. Date order and stay length are checked in
// HotelsService, where today's date is known. Without dates, the search is
// for the default stay (today → tomorrow, see STAY_DEFAULTS).
export class SearchHotelsDto implements Omit<HotelSearchRequest, "checkIn" | "checkOut"> {
  @Transform(({ value }: { value: unknown }) => (typeof value === "string" ? value.trim() : value))
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  destination!: string;

  @IsOptional()
  @Matches(ISO_DATE, { message: "checkIn must be a date like 2026-12-20" })
  checkIn?: string;

  @IsOptional()
  @Matches(ISO_DATE, { message: "checkOut must be a date like 2026-12-23" })
  checkOut?: string;

  @IsInt()
  @Min(1)
  @Max(8)
  rooms!: number;

  @IsInt()
  @Min(1)
  @Max(16)
  adults!: number;

  @IsInt()
  @Min(0)
  @Max(8)
  children!: number;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(8)
  @IsInt({ each: true })
  @Min(0, { each: true })
  @Max(17, { each: true })
  childAges?: number[];
}
