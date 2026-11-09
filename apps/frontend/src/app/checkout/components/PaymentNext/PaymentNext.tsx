"use client";

import { useState } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import LockOutlined from "@mui/icons-material/LockOutlined";
import type { CheckoutSummary } from "@quickhotels/types/checkout";
import { ApiError } from "@/lib/api/client";
import { checkoutApi } from "@/lib/api/checkout";
import { paymentsApi } from "@/lib/api/payments";
import { useAuth } from "@/lib/auth/useAuth";
import { checkoutKeyFor } from "@/lib/checkoutKeys";
import { formatPrice } from "@/lib/format";
import { PaymentCancelled, payWithRazorpay } from "@/lib/payments/razorpay";
import { styles } from "./PaymentNext.styles";

interface PaymentNextProps {
  checkout: CheckoutSummary;
  onEdit: () => void;
  disabled?: boolean;
  // Re-reads the checkout: after paying (to move to the booking), or when the
  // server changed it (a coupon removed at payment).
  onReload: () => Promise<void>;
}

// After guest details: who the booking is for, then Pay (Razorpay). Once
// paid, the checkout page moves on to the booking's confirmation page.
export default function PaymentNext({ checkout, onEdit, disabled = false, onReload }: PaymentNextProps) {
  const { token } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const details = checkout.guestDetails;
  const lead = details?.rooms[0]?.guests[0];
  const guests = details?.rooms.flatMap((room) => room.guests).length ?? 0;

  async function pay() {
    const key = checkoutKeyFor(checkout.checkoutId);
    if (!key) return setError("This checkout was started in another tab. Please choose your room again.");
    setBusy(true);
    setError(null);
    try {
      const order = await checkoutApi.startPayment(checkout.checkoutId, key, token);
      const result = await payWithRazorpay(order);
      await paymentsApi.confirm(result);
      await onReload();
    } catch (caught) {
      if (!(caught instanceof PaymentCancelled)) setError(caught instanceof Error ? caught.message : "The payment didn't go through. Please try again.");
      // A coupon removed at payment changes the total shown.
      if (caught instanceof ApiError && caught.status === 409) await onReload().catch(() => undefined);
      setBusy(false);
    }
  }

  return (
    <Box sx={styles.root}>
      <Box sx={styles.card}>
        <Box sx={styles.header}>
          <Typography component="h2" sx={styles.title}>
            Guest details saved
          </Typography>
          <Button size="small" onClick={onEdit} disabled={busy}>
            Edit
          </Button>
        </Box>
        {lead && (
          <Typography sx={styles.line}>
            Booking for <strong>{`${lead.title} ${lead.firstName} ${lead.lastName}`}</strong>
            {guests > 1 ? ` and ${guests - 1} more` : ""}
          </Typography>
        )}
        {details && (
          <Typography sx={styles.line}>
            Confirmation goes to {details.contact.email} · {details.contact.phoneCode} {details.contact.phone}
          </Typography>
        )}
      </Box>

      <Box sx={styles.card}>
        <Typography component="h2" sx={styles.title}>
          Payment
        </Typography>
        {error && (
          <Alert severity="error" sx={styles.alert}>
            {error}
          </Alert>
        )}
        <Button variant="contained" size="large" startIcon={<LockOutlined />} onClick={() => void pay()} disabled={busy || disabled} fullWidth>
          {busy ? "Opening secure payment…" : `Pay ${formatPrice(checkout.payable)} securely`}
        </Button>
        <Typography sx={styles.note}>
          Cards, UPI and net banking through Razorpay. We show your booking as confirmed only once the hotel confirms it; if it
          can&apos;t, you get a full refund.
        </Typography>
      </Box>
    </Box>
  );
}
