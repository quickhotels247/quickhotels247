import { IsString, IsUUID, MaxLength, MinLength } from "class-validator";
import type { CreateCheckoutRequest } from "@quickhotels/types/checkout";

// Body of POST /api/v1/checkouts: the rate picked on the hotel page.
export class CreateCheckoutDto implements CreateCheckoutRequest {
  @IsUUID()
  roomsId!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(100)
  optionId!: string;
}
