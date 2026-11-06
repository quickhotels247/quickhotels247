import { Transform, Type } from "class-transformer";
import { ArrayMaxSize, IsArray, IsBoolean, IsIn, IsInt, IsNumber, IsOptional, IsString, Matches, Max, MaxLength, Min } from "class-validator";
import type { DepartWindow, FlightFilters, FlightSort } from "@quickhotels/types/flights";
import { DEPART_WINDOWS } from "../flight-filters.js";

// "0,1" → [0, 1]; "6E,AI" → ["6E", "AI"]; "true" → true.
const list = ({ value }: { value: unknown }) => (typeof value === "string" ? value.split(",").map((item) => item.trim()).filter(Boolean) : value);
const numbers = ({ value }: { value: unknown }) => (typeof value === "string" ? value.split(",").filter(Boolean).map(Number) : value);
const flag = ({ value }: { value: unknown }) => value === true || value === "true";

// Query of GET /api/v1/flights/searches/:searchId/results (and paging of the search).
export class FlightResultsQueryDto implements FlightFilters {
  // Which list: "ONWARD", "RETURN", "COMBO", or "0", "1"… for multi-city. First list by default.
  @IsOptional()
  @IsString()
  @MaxLength(10)
  trip?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  page: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(5)
  @Max(50)
  pageSize: number = 20;

  @IsOptional()
  @IsIn(["price", "duration", "departure"])
  sort: FlightSort = "price";

  // Kept for older links: the same as stops=0.
  @IsOptional()
  @Transform(flag)
  @IsBoolean()
  directOnly: boolean = false;

  @IsOptional()
  @Transform(numbers)
  @IsArray()
  @ArrayMaxSize(3)
  @IsInt({ each: true })
  @Min(0, { each: true })
  @Max(2, { each: true })
  stops?: number[];

  @IsOptional()
  @Transform(list)
  @IsArray()
  @ArrayMaxSize(30)
  @Matches(/^[A-Z0-9]{2,3}$/, { each: true })
  airlines?: string[];

  @IsOptional()
  @Transform(list)
  @IsArray()
  @IsIn(DEPART_WINDOWS, { each: true })
  departWindows?: DepartWindow[];

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxPrice?: number;

  @IsOptional()
  @Transform(flag)
  @IsBoolean()
  refundableOnly?: boolean;

  // Paging and filters as the service takes them.
  toView(page = this.page) {
    const filters: FlightFilters = {};
    const stops = this.directOnly ? [0] : this.stops;
    if (stops?.length) filters.stops = stops;
    if (this.airlines?.length) filters.airlines = this.airlines;
    if (this.departWindows?.length) filters.departWindows = this.departWindows;
    if (this.maxPrice !== undefined) filters.maxPrice = this.maxPrice;
    if (this.refundableOnly) filters.refundableOnly = true;
    return { trip: this.trip, page, pageSize: this.pageSize, sort: this.sort, filters };
  }
}
