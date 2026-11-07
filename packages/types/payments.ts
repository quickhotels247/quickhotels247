// Online payment (Razorpay). The server creates an order for what's payable;
// the browser opens Razorpay Checkout with it, then sends back the result.

// POST /api/v1/flights/reviews/:id/payment
export interface PaymentOrder {
  provider: "razorpay";
  orderId: string;
  // Public key id (rzp_test_… / rzp_live_…): safe for the browser.
  keyId: string;
  // In paise.
  amount: number;
  currency: string;
  name: string;
  description: string;
  prefill: { name: string | null; email: string | null; contact: string | null };
}

// POST /api/v1/payments/razorpay/confirm, from Razorpay Checkout's handler.
export interface ConfirmPaymentRequest {
  orderId: string;
  paymentId: string;
  signature: string;
}

export interface ConfirmPaymentResponse {
  kind: "flight" | "hotel";
  // The flight review or hotel checkout that was paid.
  id: string;
}
