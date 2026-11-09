"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Container from "@mui/material/Container";
import Divider from "@mui/material/Divider";
import Typography from "@mui/material/Typography";
import CheckCircleRounded from "@mui/icons-material/CheckCircleRounded";
import ErrorOutlineRounded from "@mui/icons-material/ErrorOutlineRounded";
import type { FlightReviewSummary } from "@quickhotels/types/flight-checkout";
import JourneyRow from "@/components/flight/JourneyRow";
import { CONTACT_EMAIL } from "@/config/site";
import { routes } from "@/config/navigation";
import { ApiError } from "@/lib/api/client";
import { flightBookingsApi } from "@/lib/api/flightBookings";
import { flightReviewsApi } from "@/lib/api/flightReviews";
import { useAuth } from "@/lib/auth/useAuth";
import { checkoutKeyFor } from "@/lib/checkoutKeys";
import { formatPrice } from "@/lib/format";
import { styles } from "./FlightBookingPage.styles";

const POLL_MS = 4_000;

// After payment: "Booking your flight…" while the airline tickets, then the
// PNR and tickets, or why it failed and the refund. Polls while processing.
export default function FlightBookingPage() {
  const { reviewId } = useParams<{ reviewId: string }>();
  const params = useSearchParams();
  const link = params.get("t");
  const { token, status: authStatus } = useAuth();
  const [review, setReview] = useState<FlightReviewSummary | null>(null);
  const [problem, setProblem] = useState<"missing" | "error" | null>(null);

  // Opens with this tab's checkout key, else the private email link, else the
  // signed-in owner's session.
  useEffect(() => {
    if (authStatus === "loading") return;
    const key = checkoutKeyFor(reviewId);
    if (!key && !link && !token) return setProblem("missing");
    let stopped = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const load = async () => {
      try {
        const next = key ? await flightReviewsApi.get(reviewId, key) : await flightBookingsApi.view(reviewId, { token, link });
        if (stopped) return;
        setReview(next);
        setProblem(null);
        if (next.status === "processing") timer = setTimeout(load, POLL_MS);
      } catch (error) {
        if (stopped) return;
        if (error instanceof ApiError && error.status === 404) return setProblem("missing");
        setProblem("error");
        timer = setTimeout(load, POLL_MS * 2);
      }
    };
    void load();
    return () => {
      stopped = true;
      clearTimeout(timer);
    };
  }, [reviewId, link, token, authStatus]);

  if (problem === "missing") {
    return (
      <Container maxWidth="sm" sx={styles.root}>
        <Alert severity="info">
          Open this booking from the link in your confirmation email, or sign in with the account you booked with. Your PNR is also in that email. For help, write to {CONTACT_EMAIL}.
        </Alert>
      </Container>
    );
  }
  if (!review) {
    return (
      <Container maxWidth="sm" sx={[styles.root, styles.center]}>
        <CircularProgress />
      </Container>
    );
  }

  const booking = review.booking;
  return (
    <Container maxWidth="md" sx={styles.root}>
      {review.status === "processing" && (
        <Box sx={styles.hero} role="status" aria-live="polite">
          <CircularProgress size={44} />
          <Typography component="h1" sx={styles.title}>
            Booking your flight…
          </Typography>
          <Typography sx={styles.text}>Your payment is received. The airline is issuing your tickets; this usually takes under a minute. Please don&apos;t pay again.</Typography>
        </Box>
      )}
      {review.status === "confirmed" && booking && (
        <Box sx={styles.hero}>
          <CheckCircleRounded color="success" sx={styles.icon} />
          <Typography component="h1" sx={styles.title}>
            Your flight is booked
          </Typography>
          <Typography sx={styles.text}>Tickets are issued and sent to {review.travellerDetails?.contact.email}.</Typography>
          <Box sx={styles.pnrs}>
            {booking.pnrs.map((pnr) => (
              <Box key={pnr.route} sx={styles.pnr}>
                <Typography sx={styles.pnrLabel}>PNR · {pnr.route}</Typography>
                <Typography sx={styles.pnrValue}>{pnr.pnr}</Typography>
              </Box>
            ))}
          </Box>
        </Box>
      )}
      {review.status === "failed" && (
        <Box sx={styles.hero}>
          <ErrorOutlineRounded color="error" sx={styles.icon} />
          <Typography component="h1" sx={styles.title}>
            We couldn&apos;t book this flight
          </Typography>
          <Typography sx={styles.text}>{booking?.failureReason ?? "The airline couldn't issue the tickets."} Nothing is booked.</Typography>
          {booking?.refund && (
            <Alert severity={booking.refund.status === "failed" ? "warning" : "success"} sx={styles.alert}>
              {booking.refund.status === "failed"
                ? `We're refunding ${formatPrice(booking.refund.amount)}; our team is on it and will email you.`
                : `${formatPrice(booking.refund.amount)} is refunded to your original payment method. Banks usually show it within 5–7 working days.`}
            </Alert>
          )}
          <Button component={Link} href={routes.flights} variant="contained" sx={styles.cta}>
            Search flights again
          </Button>
        </Box>
      )}
      {(review.status === "travellers" || review.status === "payment") && (
        <Alert severity="info" action={<Button component={Link} href={`${routes.flightReview}/${review.reviewId}`}>Continue</Button>}>
          This booking isn&apos;t paid yet.
        </Alert>
      )}

      <Box sx={styles.card}>
        <Typography component="h2" sx={styles.h2}>
          Your trip
        </Typography>
        {review.journeys.map((journey, i) => (
          <JourneyRow key={i} journey={journey} />
        ))}
        <Divider sx={styles.divider} />
        <Typography sx={styles.line}>
          {review.travellerDetails?.travellers.map((t) => `${t.title} ${t.firstName} ${t.lastName}`).join(" · ")}
        </Typography>
        {booking && booking.tickets.length > 0 && (
          <Box component="ul" sx={styles.tickets}>
            {booking.tickets.map((ticket) => (
              <li key={`${ticket.traveller}-${ticket.route}`}>
                {ticket.traveller} · {ticket.route} · ticket {ticket.ticket}
              </li>
            ))}
          </Box>
        )}
        <Typography sx={styles.line}>
          Paid {formatPrice(review.payable)}
          {booking?.bookingId ? ` · Booking reference ${booking.bookingId}` : ""}
        </Typography>
      </Box>
      {review.status === "confirmed" && (
        <Typography sx={styles.note}>Carry a government photo ID. Check in online on the airline&apos;s website or app using your PNR.</Typography>
      )}
    </Container>
  );
}
