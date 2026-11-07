import type { ConfirmPaymentRequest } from "@quickhotels/types/payments";
import { Matches } from "class-validator";

export class ConfirmPaymentDto implements ConfirmPaymentRequest {
  @Matches(/^order_[A-Za-z0-9]{6,40}$/)
  orderId: string;

  @Matches(/^pay_[A-Za-z0-9]{6,40}$/)
  paymentId: string;

  @Matches(/^[a-f0-9]{64}$/)
  signature: string;
}
