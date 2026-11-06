import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import type { BookingDetails } from "@quickhotels/types/bookings";
import { formatClock, formatShortDate } from "@/lib/dates";
import { formatPrice } from "@/lib/format";
import { styles } from "./PolicyCard.styles";

// "2026-12-18T23:59:59" (India time) → "18 Dec, 11:59 PM".
function when(iso: string) {
  const [day, clock = "00:00"] = iso.split("T");
  return `${formatShortDate(day!)}, ${formatClock(clock)}`;
}

const CANCELLATION_TEXT = {
  requested: "We've received your cancellation request.",
  in_progress: "Your cancellation is being processed with the hotel.",
  confirmed: "Your booking has been cancelled.",
  rejected: "The hotel didn't accept the cancellation. Please contact support.",
  failed: "We couldn't complete the cancellation. Our team will contact you.",
} as const;

// The cancellation terms saved at booking time, and any cancellation or
// refund in progress (refunds are shown separately from the cancellation).
export default function PolicyCard({ booking }: { booking: BookingDetails }) {
  const policy = booking.cancellationPolicy;
  const { cancellation, refunds } = booking;
  return (
    <Box component="section" aria-labelledby="policy-title" sx={styles.root}>
      <Typography component="h2" id="policy-title" sx={styles.title}>
        Cancellation policy
      </Typography>
      {!policy ? (
        <Typography sx={styles.text}>The hotel&apos;s cancellation terms will appear here once the booking is confirmed.</Typography>
      ) : policy.refundable && policy.freeCancellationUntil ? (
        <Typography sx={[styles.text, styles.good]}>Free cancellation until {when(policy.freeCancellationUntil)} (India time).</Typography>
      ) : (
        <Typography sx={styles.text}>Non-refundable: no refund if you cancel or don&apos;t show up.</Typography>
      )}
      {policy && policy.charges.some((charge) => charge.amount.amount > 0) && (
        <Box component="ul" sx={styles.list}>
          {policy.charges
            .filter((charge) => charge.amount.amount > 0)
            .map((charge) => (
              <li key={charge.from}>
                From {when(charge.from)}: {formatPrice(charge.amount)} charge
              </li>
            ))}
        </Box>
      )}
      {cancellation && (
        <Alert severity={cancellation.status === "rejected" || cancellation.status === "failed" ? "error" : "info"} sx={styles.alert}>
          {CANCELLATION_TEXT[cancellation.status]}
          {cancellation.penalty && ` Cancellation charge: ${formatPrice(cancellation.penalty)}.`}
          {cancellation.refundEstimate && ` Expected refund: ${formatPrice(cancellation.refundEstimate)}.`}
        </Alert>
      )}
      {refunds.map((refund, i) => (
        <Alert key={i} severity={refund.status === "completed" ? "success" : refund.status === "failed" ? "error" : "info"} sx={styles.alert}>
          Refund of {formatPrice(refund.amount)}:{" "}
          {refund.status === "completed" ? "sent to your original payment method" : refund.status === "failed" ? "failed; our team will contact you" : "in progress"}.
        </Alert>
      ))}
    </Box>
  );
}
