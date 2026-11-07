"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import LockOutlined from "@mui/icons-material/LockOutlined";
import type { FlightReviewSummary } from "@quickhotels/types/flight-checkout";
import { routes } from "@/config/navigation";
import { flightReviewsApi } from "@/lib/api/flightReviews";
import { paymentsApi } from "@/lib/api/payments";
import { checkoutKeyFor } from "@/lib/checkoutKeys";
import { formatPrice } from "@/lib/format";
import { PaymentCancelled, payWithRazorpay } from "@/lib/payments/razorpay";
import { styles } from "./PaymentStep.styles";

interface PaymentStepProps {
  review: FlightReviewSummary;
  onEdit: () => void;
}

// After travellers: who's flying and where tickets go, then Pay (Razorpay).
// Once paid, the booking page shows ticketing and the PNR.
export default function PaymentStep({ review, onEdit }: PaymentStepProps) {
  const router = useRouter();
  const details = review.travellerDetails;
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function pay() {
    const key = checkoutKeyFor(review.reviewId);
    if (!key) return setError("This booking was started in another tab. Please choose your flights again.");
    setBusy(true);
    setError(null);
    try {
      const order = await flightReviewsApi.startPayment(review.reviewId, key);
      const result = await payWithRazorpay(order);
      await paymentsApi.confirm(result);
      router.push(`${routes.flightBooking}/${review.reviewId}`);
    } catch (caught) {
      if (!(caught instanceof PaymentCancelled)) setError(caught instanceof Error ? caught.message : "The payment didn't go through. Please try again.");
      setBusy(false);
    }
  }

  return (
    <Box sx={styles.root}>
      <Box sx={styles.card}>
        <Box sx={styles.header}>
          <Typography component="h2" sx={styles.title}>
            Travellers
          </Typography>
          <Button size="small" onClick={onEdit} disabled={busy}>
            Edit
          </Button>
        </Box>
        <Box component="ul" sx={styles.list}>
          {details?.travellers.map((traveller, i) => (
            <li key={i}>
              {traveller.title} {traveller.firstName} {traveller.lastName}
              <Box component="span" sx={styles.type}>
                {" "}
                · {traveller.type}
              </Box>
            </li>
          ))}
        </Box>
        {details && (
          <Typography sx={styles.line}>
            Tickets go to {details.contact.email} · {details.contact.phoneCode} {details.contact.phone}
          </Typography>
        )}
      </Box>
      <Box sx={styles.card}>
        <Typography component="h2" sx={styles.title}>
          Payment
        </Typography>
        {error && <Alert severity="error" sx={styles.alert}>{error}</Alert>}
        <Button variant="contained" size="large" startIcon={<LockOutlined />} onClick={() => void pay()} disabled={busy} fullWidth>
          {busy ? "Opening secure payment…" : `Pay ${formatPrice(review.payable)} securely`}
        </Button>
        <Typography sx={styles.note}>
          Cards, UPI and net banking through Razorpay. We show your booking as confirmed only once the airline issues your tickets; if it can&apos;t, you get a full refund.
        </Typography>
      </Box>
    </Box>
  );
}
