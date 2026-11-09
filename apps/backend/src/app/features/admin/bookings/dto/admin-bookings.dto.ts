import type { AdminFlightStatus, AdminHotelCancelRequest, AdminHotelFilter, AdminRefundRequest } from "@quickhotels/types/admin";
import { Transform } from "class-transformer";
import { IsBoolean, IsIn, IsInt, IsNumber, IsOptional, IsString, Matches, Max, MaxLength, Min } from "class-validator";

const FLIGHT_STATUSES: AdminFlightStatus[] = ["travellers", "payment", "paid", "booking", "pending", "confirmed", "failed"];
const page = ({ value }: { value: unknown }) => Number(value);

export class FlightBookingListQueryDto {
  // "paid" here means every booking with a payment (paid onwards); "unpaid" the rest.
  @IsOptional()
  @IsIn([...FLIGHT_STATUSES, "all", "unpaid", "processing"])
  status?: AdminFlightStatus | "all" | "unpaid" | "processing";

  @IsOptional()
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  @IsString()
  @MaxLength(100)
  q?: string;

  @IsOptional()
  @Transform(page)
  @IsInt()
  @Min(1)
  @Max(1000)
  page: number = 1;
}

export class PaymentListQueryDto {
  @IsOptional()
  @IsIn(["CREATED", "PENDING", "CAPTURED", "FAILED", "REFUNDED", "PARTIALLY_REFUNDED"])
  status?: string;

  @IsOptional()
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  @IsString()
  @MaxLength(100)
  q?: string;

  @IsOptional()
  @Transform(page)
  @IsInt()
  @Min(1)
  @Max(1000)
  page: number = 1;
}

export class RefundDto implements AdminRefundRequest {
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(1)
  amount?: number | null;

  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  @IsString()
  @Matches(/^[\s\S]{5,300}$/, { message: "Say why (5–300 characters); it's kept with the refund." })
  reason: string;
}

export class HotelBookingListQueryDto {
  @IsOptional()
  @IsIn(["all", "processing", "confirmed", "cancelled", "failed"])
  status: AdminHotelFilter = "all";

  @IsOptional()
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  @IsString()
  @MaxLength(100)
  q?: string;

  @IsOptional()
  @Transform(page)
  @IsInt()
  @Min(1)
  @Max(1000)
  page: number = 1;
}

export class HotelCancelDto implements AdminHotelCancelRequest {
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  @IsString()
  @Matches(/^[\s\S]{5,300}$/, { message: "Say why (5–300 characters); it's kept with the cancellation." })
  reason: string;

  @IsOptional()
  @IsBoolean()
  waiveFee?: boolean;
}
