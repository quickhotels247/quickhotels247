import { Type } from "class-transformer";
import { ArrayMaxSize, ArrayMinSize, IsArray, IsString, IsUUID, MaxLength, MinLength, ValidateNested } from "class-validator";
import type { CreateFlightReviewRequest } from "@quickhotels/types/flight-checkout";

export class ChosenFareDto {
  // The list it was chosen from: "ONWARD", "RETURN", "COMBO", "0", "1"…
  @IsString()
  @MinLength(1)
  @MaxLength(10)
  trip!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(200)
  id!: string;
}

// Body of POST /api/v1/flights/reviews: one fare per list of the search.
export class CreateFlightReviewDto implements CreateFlightReviewRequest {
  @IsUUID()
  searchId!: string;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(6)
  @ValidateNested({ each: true })
  @Type(() => ChosenFareDto)
  fares!: ChosenFareDto[];
}
