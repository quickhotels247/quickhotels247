"use client";

import { useState } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import type { BookingDetails, CancelBookingRequest } from "@quickhotels/types/bookings";
import { formatPrice } from "@/lib/format";
import { styles } from "./CancelBooking.styles";

const REASONS = ["Change of plans", "Found a better price", "Booked by mistake", "Travel dates changed", "Hotel or location issue", "Other"];

interface CancelBookingProps {
  booking: BookingDetails;
  onCancel: (request: CancelBookingRequest) => Promise<void>;
}

// "Cancel booking": shows the fee and the refund for cancelling now (from
// the policy sold with the booking), then asks the hotel to cancel.
export default function CancelBooking({ booking, onCancel }: CancelBookingProps) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const quote = booking.cancelQuote;
  if (!quote?.allowed) return null;
  const free = quote.fee.amount === 0;
  const nothingBack = quote.refund.amount === 0;

  async function confirm() {
    setBusy(true);
    setError(null);
    try {
      await onCancel({ expectedRefund: quote!.refund.amount, reason: reason || undefined });
      setOpen(false);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "We couldn't cancel this booking. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Box sx={styles.root}>
      <Typography sx={styles.line}>
        {free ? "You can cancel for free right now." : nothingBack ? "Cancelling now gives no refund." : `Cancelling now costs ${formatPrice(quote.fee)}.`}
      </Typography>
      <Button variant="outlined" color="error" onClick={() => setOpen(true)}>
        Cancel booking
      </Button>
      <Dialog open={open} onClose={() => !busy && setOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>Cancel booking {booking.reference}?</DialogTitle>
        <DialogContent sx={styles.content}>
          <Typography sx={styles.text}>
            {booking.hotel.name} · this can&apos;t be undone.
          </Typography>
          <Box sx={styles.sums}>
            <Box sx={styles.sum}>
              <span>You paid</span>
              <strong>{formatPrice(booking.payment?.amount ?? booking.price.total)}</strong>
            </Box>
            <Box sx={styles.sum}>
              <span>Cancellation fee</span>
              <strong>{free ? "Free" : formatPrice(quote.fee)}</strong>
            </Box>
            <Box sx={[styles.sum, styles.total]}>
              <span>Refund</span>
              <strong>{formatPrice(quote.refund)}</strong>
            </Box>
          </Box>
          {!nothingBack && <Typography sx={styles.note}>Refunded to your original payment method once the hotel confirms the cancellation; banks usually take 5–7 working days.</Typography>}
          <TextField select label="Reason (optional)" value={reason} onChange={(event) => setReason(event.target.value)} fullWidth size="small">
            <MenuItem value="">Prefer not to say</MenuItem>
            {REASONS.map((item) => (
              <MenuItem key={item} value={item}>
                {item}
              </MenuItem>
            ))}
          </TextField>
          {error && <Alert severity="error">{error}</Alert>}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)} disabled={busy}>
            Keep booking
          </Button>
          <Button variant="contained" color="error" onClick={() => void confirm()} disabled={busy}>
            {busy ? "Cancelling…" : "Cancel booking"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
