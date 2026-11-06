import { Transform, Type } from "class-transformer";
import { IsInt, IsOptional, IsString, Max, MaxLength, Min, MinLength } from "class-validator";

// Query of GET /api/v1/destinations/suggestions: ?q=hyd&limit=8
export class SuggestionsQueryDto {
  @Transform(({ value }: { value: unknown }) => (typeof value === "string" ? value.trim().replace(/\s+/g, " ") : value))
  @IsString()
  @MinLength(2)
  @MaxLength(60)
  q!: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(10)
  limit: number = 8;
}
