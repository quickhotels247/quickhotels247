import { Transform, Type } from "class-transformer";
import { ArrayMaxSize, IsArray, IsInt, IsOptional, IsUUID, Matches, Max, Min } from "class-validator";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const numberList = ({ value }: { value: unknown }) =>
  typeof value === "string" ? value.split(",").filter(Boolean).map(Number) : value;

// Query of GET /api/v1/hotels/:id/rooms. Without dates, the default stay
// (today → tomorrow); the rules are checked in the service.
export class HotelRoomsQueryDto {
  @IsOptional()
  @Matches(ISO_DATE, { message: "checkIn must be a date like 2026-12-20" })
  checkIn?: string;

  @IsOptional()
  @Matches(ISO_DATE, { message: "checkOut must be a date like 2026-12-23" })
  checkOut?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(8)
  rooms: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(16)
  adults: number = 2;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(8)
  children: number = 0;

  @IsOptional()
  @Transform(numberList)
  @IsArray()
  @ArrayMaxSize(8)
  @IsInt({ each: true })
  @Min(0, { each: true })
  @Max(17, { each: true })
  childAges?: number[];

  // The visitor's results search, to price in the same supplier session.
  @IsOptional()
  @IsUUID()
  searchId?: string;
}
