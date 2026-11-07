import { registerAs } from "@nestjs/config";

export interface RazorpayConfig {
  keyId: string | null;
  keySecret: string | null;
  webhookSecret: string | null;
}

export const razorpayConfig = registerAs("razorpay", (): RazorpayConfig => ({
  keyId: process.env.RAZORPAY_KEY_ID?.trim() || null,
  keySecret: process.env.RAZORPAY_KEY_SECRET?.trim() || null,
  webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET?.trim() || null,
}));
