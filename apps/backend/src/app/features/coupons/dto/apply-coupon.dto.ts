import type { ApplyCouponRequest } from "@quickhotels/types/coupons";
import { Transform } from "class-transformer";
import { Matches } from "class-validator";

export class ApplyCouponDto implements ApplyCouponRequest {
  @Transform(({ value }) => (typeof value === "string" ? value.trim().toUpperCase() : value))
  @Matches(/^[A-Z0-9]{3,20}$/, { message: "Codes have 3–20 letters and numbers." })
  code: string;
}
