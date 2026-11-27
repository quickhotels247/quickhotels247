import { IsIn } from "class-validator";
import type { CouponAction } from "@quickhotels/types/coupons";

export class CouponActionDto {
  @IsIn(["pause", "resume", "end"], { message: "Choose pause, resume or end." })
  action: CouponAction;
}
