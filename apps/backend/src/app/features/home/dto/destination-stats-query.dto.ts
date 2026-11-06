import { Transform } from "class-transformer";
import { ArrayMaxSize, ArrayMinSize, IsArray, IsString, MaxLength } from "class-validator";

// ?names=Goa,Mumbai,Jaipur (up to 20).
export class DestinationStatsQueryDto {
  @Transform(({ value }: { value: unknown }) =>
    typeof value === "string" ? value.split(",").map((name) => name.trim()).filter(Boolean) : value,
  )
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(20)
  @IsString({ each: true })
  @MaxLength(60, { each: true })
  names!: string[];
}
