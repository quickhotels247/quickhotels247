import { Global, Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { PaymentsController } from "./payments.controller.js";
import { PaymentsRepository } from "./payments.repository.js";
import { PaymentReconciler } from "./payment-reconciler.service.js";
import { PaymentsService } from "./payments.service.js";
import { RazorpayClient } from "./razorpay/razorpay.client.js";
import { razorpayConfig } from "./razorpay/razorpay.config.js";

// Razorpay payments for flights and hotels. Products register a fulfiller
// (book with the supplier) that runs once a payment is captured.
@Global()
@Module({
  imports: [ConfigModule.forFeature(razorpayConfig)],
  controllers: [PaymentsController],
  providers: [RazorpayClient, PaymentsRepository, PaymentsService, PaymentReconciler],
  exports: [PaymentsService],
})
export class PaymentsModule {}
