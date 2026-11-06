import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import CheckCircleRounded from "@mui/icons-material/CheckCircleRounded";
import ErrorOutlineRounded from "@mui/icons-material/ErrorOutlineRounded";
import HourglassTopRounded from "@mui/icons-material/HourglassTopRounded";
import InfoOutlined from "@mui/icons-material/InfoOutlined";
import type { BookingDetails } from "@quickhotels/types/bookings";
import { styles } from "./ConfirmationBanner.styles";

interface ConfirmationBannerProps {
  booking: BookingDetails;
  checking: boolean;
  onCheckAgain: () => void;
}

// The result, said plainly (spec §4.6): confirmed only when the hotel has
// confirmed; otherwise in progress (don't book again) or needs attention.
export default function ConfirmationBanner({ booking, checking, onCheckAgain }: ConfirmationBannerProps) {
  const tone =
    booking.status === "confirmed"
      ? { icon: <CheckCircleRounded />, title: "Your booking is confirmed", text: `A confirmation has been sent to ${booking.contact.email}.`, sx: styles.good }
      : booking.status === "pending"
        ? { icon: <HourglassTopRounded />, title: "Confirmation in progress", text: "Your payment is safe. We're waiting for the hotel to confirm, which usually takes a few minutes. Please don't book again; we'll email you as soon as it's confirmed.", sx: styles.waiting }
        : booking.status === "action_required"
          ? { icon: <ErrorOutlineRounded />, title: "We need to sort something out", text: "There was a problem confirming this booking with the hotel. Our team will contact you, and any amount paid is protected.", sx: styles.bad }
          : { icon: <InfoOutlined />, title: "This booking has been cancelled", text: "See the cancellation and refund details below.", sx: styles.neutral };
  return (
    <Box sx={[styles.root, tone.sx]} role="status">
      <Box sx={styles.icon} aria-hidden="true">
        {tone.icon}
      </Box>
      <Box sx={styles.body}>
        <Typography component="h1" sx={styles.title}>
          {tone.title}
        </Typography>
        <Typography sx={styles.text}>{tone.text}</Typography>
        <Box sx={styles.refs}>
          <Typography sx={styles.ref}>
            QuickHotels24/7 reference <strong>{booking.reference}</strong>
          </Typography>
          {booking.supplierConfirmation && (
            <Typography sx={styles.ref}>
              Hotel confirmation number <strong>{booking.supplierConfirmation}</strong>
            </Typography>
          )}
        </Box>
        {booking.status === "pending" && (
          <Button variant="outlined" color="inherit" size="small" onClick={onCheckAgain} disabled={checking} sx={styles.check}>
            {checking ? "Checking…" : "Check status again"}
          </Button>
        )}
      </Box>
    </Box>
  );
}
