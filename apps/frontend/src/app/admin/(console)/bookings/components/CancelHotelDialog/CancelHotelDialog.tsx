"use client";

import { useEffect, useState, type FormEvent } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import FormControlLabel from "@mui/material/FormControlLabel";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import type { AdminHotelBooking, AdminHotelCancelRequest } from "@quickhotels/types/admin";
import { money } from "@/lib/admin/format";
import { useRequest } from "@/lib/hooks/useRequest";
import { styles } from "./CancelHotelDialog.styles";

interface CancelHotelDialogProps {
  open: boolean;
  booking: AdminHotelBooking;
  onCancel: (request: AdminHotelCancelRequest) => Promise<void>;
  onClose: () => void;
}

// Staff cancel a confirmed hotel booking for the customer: with the hotel,
// then a refund by the policy, or of everything paid when the fee is waived.
export default function CancelHotelDialog({ open, booking, onCancel, onClose }: CancelHotelDialogProps) {
  const [reason, setReason] = useState("");
  const [waive, setWaive] = useState(false);
  const { busy, error, setError, run } = useRequest();
  useEffect(() => {
    if (!open) return;
    setReason("");
    setWaive(false);
    setError("");
  }, [open, setError]);

  const quote = booking.cancelQuote;
  const paid = quote ? { amount: quote.fee.amount + quote.refund.amount, currency: quote.refund.currency } : booking.total;
  const refund = waive ? paid : quote?.refund;

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void run(() => onCancel({ reason: reason.trim(), waiveFee: waive }));
  }

  return (
    <Dialog open={open} onClose={busy ? undefined : onClose} fullWidth maxWidth="xs" slotProps={{ paper: { component: "form", onSubmit: submit } as object }}>
      <DialogTitle>Cancel {booking.reference}</DialogTitle>
      <DialogContent sx={styles.content}>
        {error && <Alert severity="error">{error}</Alert>}
        <Typography sx={styles.text}>We ask the hotel to cancel (via {booking.supplier}), then refund the customer through Razorpay and email them.</Typography>
        <Box sx={styles.sums}>
          <Box sx={styles.sum}><span>Paid</span><b>{money(paid)}</b></Box>
          <Box sx={styles.sum}><span>Fee by the policy now</span><b>{money(quote?.fee)}</b></Box>
          <Box sx={[styles.sum, styles.total]}><span>Refund</span><b>{money(refund)}</b></Box>
        </Box>
        <FormControlLabel
          control={<Checkbox checked={waive} onChange={(event) => setWaive(event.target.checked)} disabled={busy || !quote || quote.fee.amount === 0} />}
          label="Waive the fee (refund everything paid)"
        />
        {waive && quote && quote.fee.amount > 0 && (
          <Alert severity="warning">The hotel may still charge us its fee; waiving it comes out of our margin.</Alert>
        )}
        <TextField label="Reason" required multiline minRows={2} value={reason} onChange={(event) => setReason(event.target.value)} helperText="Kept with the cancellation and in the activity log." disabled={busy} slotProps={{ htmlInput: { maxLength: 300 } }} />
      </DialogContent>
      <DialogActions sx={styles.actions}>
        <Button onClick={onClose} disabled={busy}>
          Keep booking
        </Button>
        <Button type="submit" color="error" variant="contained" disabled={busy || reason.trim().length < 5}>
          {busy ? "Cancelling…" : "Cancel booking"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
