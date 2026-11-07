import type { ConfirmPaymentRequest, ConfirmPaymentResponse } from "@quickhotels/types/payments";
import { postJson } from "./client";

export const paymentsApi = {
  confirm: (request: ConfirmPaymentRequest) => postJson<ConfirmPaymentResponse>("/v1/payments/razorpay/confirm", request),
};
