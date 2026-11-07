import type { ConfirmPaymentRequest, PaymentOrder } from "@quickhotels/types/payments";

// Razorpay Checkout (https://checkout.razorpay.com/v1/checkout.js), loaded
// only when someone pays. Card and UPI details go to Razorpay, never to us.
const SCRIPT = "https://checkout.razorpay.com/v1/checkout.js";

interface RazorpayResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}
interface RazorpayInstance {
  open(): void;
  on(event: "payment.failed", handler: (response: { error?: { description?: string } }) => void): void;
}
type RazorpayConstructor = new (options: Record<string, unknown>) => RazorpayInstance;

let loading: Promise<RazorpayConstructor> | null = null;

function loadRazorpay(): Promise<RazorpayConstructor> {
  const existing = (window as unknown as { Razorpay?: RazorpayConstructor }).Razorpay;
  if (existing) return Promise.resolve(existing);
  loading ??= new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = SCRIPT;
    script.async = true;
    script.onload = () => resolve((window as unknown as { Razorpay: RazorpayConstructor }).Razorpay);
    script.onerror = () => {
      loading = null;
      reject(new Error("We couldn't load the payment window. Check your connection and try again."));
    };
    document.body.appendChild(script);
  });
  return loading;
}

export class PaymentCancelled extends Error {}

// Opens Checkout for the order. Resolves with what to send to our server;
// rejects with PaymentCancelled if the window is closed without paying.
export async function payWithRazorpay(order: PaymentOrder): Promise<ConfirmPaymentRequest> {
  const Razorpay = await loadRazorpay();
  return new Promise((resolve, reject) => {
    const checkout = new Razorpay({
      key: order.keyId,
      order_id: order.orderId,
      amount: order.amount,
      currency: order.currency,
      name: order.name,
      description: order.description,
      prefill: {
        ...(order.prefill.name ? { name: order.prefill.name } : {}),
        ...(order.prefill.email ? { email: order.prefill.email } : {}),
        ...(order.prefill.contact ? { contact: order.prefill.contact } : {}),
      },
      theme: { color: "#1a56db" },
      handler: (response: RazorpayResponse) =>
        resolve({ orderId: response.razorpay_order_id, paymentId: response.razorpay_payment_id, signature: response.razorpay_signature }),
      modal: { ondismiss: () => reject(new PaymentCancelled("Payment cancelled.")), confirm_close: true },
    });
    checkout.on("payment.failed", () => {
      // Checkout shows the reason and lets them retry; nothing to do here.
    });
    checkout.open();
  });
}
