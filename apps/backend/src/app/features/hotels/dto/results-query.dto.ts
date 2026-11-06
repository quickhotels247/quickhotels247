import { Transform, Type } from "class-transformer";
import { ArrayMaxSize, IsArray, IsBoolean, IsIn, IsInt, IsNumber, IsOptional, IsString, Max, MaxLength, Min } from "class-validator";
import type { HotelAmenity, HotelFilters, HotelSort } from "@quickhotels/types/hotels";

export const HOTEL_SORTS: HotelSort[] = ["recommended", "price_asc", "price_desc", "stars_desc", "distance"];
export const HOTEL_AMENITIES: HotelAmenity[] = [
  "wifi", "parking", "pool", "spa", "gym", "restaurant", "bar", "roomService",
  "airportShuttle", "airConditioning", "kitchen", "petFriendly", "familyRooms", "wheelchair", "evCharging", "beach",
];

// "4,5" → [4, 5]; "true" / "false" → booleans. Anything else is left for the validators to reject.
const numberList = ({ value }: { value: unknown }) =>
  typeof value === "string" ? value.split(",").filter(Boolean).map(Number) : value;
const textList = ({ value }: { value: unknown }) =>
  typeof value === "string" ? value.split(",").map((item) => item.trim()).filter(Boolean) : value;
const flag = ({ value }: { value: unknown }) => (value === "true" ? true : value === "false" ? false : value);

// Query of GET /api/v1/searches/:searchId/results (and paging options of the search).
export class ResultsQueryDto implements HotelFilters {
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
  @IsIn(HOTEL_SORTS)
  sort: HotelSort = "recommended";

  @IsOptional()
  @Transform(numberList)
  @IsArray()
  @ArrayMaxSize(6)
  @IsInt({ each: true })
  @Min(0, { each: true })
  @Max(5, { each: true })
  stars?: number[];

  @IsOptional()
  @Transform(flag)
  @IsBoolean()
  freeCancellation?: boolean;

  @IsOptional()
  @Transform(flag)
  @IsBoolean()
  mealIncluded?: boolean;

  @IsOptional()
  @Transform(textList)
  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  @MaxLength(40, { each: true })
  propertyTypes?: string[];

  @IsOptional()
  @Transform(textList)
  @IsArray()
  @ArrayMaxSize(16)
  @IsIn(HOTEL_AMENITIES, { each: true })
  amenities?: HotelAmenity[];

  @IsOptional()
  @Transform(({ value }: { value: unknown }) => (typeof value === "string" ? value.trim() : value))
  @IsString()
  @MaxLength(60)
  name?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0.5)
  @Max(500)
  maxDistanceKm?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minPrice?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxPrice?: number;

  // The paging options and the filters, as the service takes them.
  toView(page = this.page) {
    const { pageSize, sort, stars, freeCancellation, mealIncluded, minPrice, maxPrice, propertyTypes, amenities, name, maxDistanceKm } = this;
    const filters: HotelFilters = {};
    if (stars?.length) filters.stars = stars;
    if (freeCancellation) filters.freeCancellation = true;
    if (mealIncluded) filters.mealIncluded = true;
    if (minPrice !== undefined) filters.minPrice = minPrice;
    if (maxPrice !== undefined) filters.maxPrice = maxPrice;
    if (propertyTypes?.length) filters.propertyTypes = propertyTypes;
    if (amenities?.length) filters.amenities = amenities;
    if (name) filters.name = name;
    if (maxDistanceKm !== undefined) filters.maxDistanceKm = maxDistanceKm;
    return { page, pageSize, sort, filters };
  }
}
