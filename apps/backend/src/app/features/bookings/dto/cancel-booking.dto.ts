import { IsNumber, IsOptional, IsString, MaxLength, Min } from "class-validator";
import type { CancelBookingRequest } from "@quickhotels/types/bookings";

export class CancelBookingDto implements CancelBookingRequest {
  // The refund the customer was shown (rupees).
  @IsNumber()
  @Min(0)
  expectedRefund!: number;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  reason?: string;
}
