import type { SaveHotelRequest } from "@quickhotels/types/wishlist";
import { Transform } from "class-transformer";
import { IsInt, IsOptional, IsString, IsUrl, Max, MaxLength, Min } from "class-validator";

const trim = ({ value }: { value: unknown }) => (typeof value === "string" ? value.trim() || null : value);

export class SaveHotelDto implements SaveHotelRequest {
  @Transform(trim)
  @IsString()
  @MaxLength(200)
  name: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(100)
  city: string | null;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(100)
  country: string | null;

  // Only https photo links (shown in an <img> on our site).
  @IsOptional()
  @Transform(trim)
  @IsUrl({ protocols: ["https"], require_protocol: true })
  @MaxLength(1000)
  imageUrl: string | null;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  starRating: number | null;
}
