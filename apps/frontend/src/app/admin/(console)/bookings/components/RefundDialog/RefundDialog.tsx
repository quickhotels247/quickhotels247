"use client";

import { useEffect, useState, type FormEvent } from "react";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import InputAdornment from "@mui/material/InputAdornment";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { money } from "@/lib/admin/format";
import { useRequest } from "@/lib/hooks/useRequest";
import { styles } from "./RefundDialog.styles";

interface RefundDialogProps {
  open: boolean;
  // Still refundable (paid − refunded so far).
  refundable: number;
  // Shown above the form, e.g. "the booking stays booked".
  warning?: string | null;
  // amount null = everything still refundable.
  onRefund: (amount: number | null, reason: string) => Promise<void>;
  onClose: () => void;
}

// Money back to the customer through Razorpay, in full or part (flights and hotels).
export default function RefundDialog({ open, refundable, warning, onRefund, onClose }: RefundDialogProps) {
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const { busy, error, setError, run } = useRequest();

  useEffect(() => {
    if (!open) return;
    setAmount(String(refundable));
    setReason("");
    setError("");
  }, [open, refundable, setError]);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = Number(amount);
    if (!value || value <= 0 || value > refundable) return setError(`Enter an amount between ₹1 and ${money({ amount: refundable, currency: "INR" })}.`);
    void run(() => onRefund(value === refundable ? null : value, reason.trim()));
  }

  return (
    <Dialog open={open} onClose={busy ? undefined : onClose} fullWidth maxWidth="xs" slotProps={{ paper: { component: "form", onSubmit: submit } as object }}>
      <DialogTitle>Refund the customer</DialogTitle>
      <DialogContent sx={styles.content}>
        {error && <Alert severity="error">{error}</Alert>}
        {warning && <Alert severity="warning">{warning}</Alert>}
        <Typography sx={styles.text}>Refundable now: {money({ amount: refundable, currency: "INR" })}. It goes back to the customer&apos;s original payment method through Razorpay.</Typography>
        <TextField
          label="Amount"
          required
          value={amount}
          onChange={(event) => setAmount(event.target.value.replace(/[^\d.]/g, ""))}
          inputMode="decimal"
          disabled={busy}
          slotProps={{ input: { startAdornment: <InputAdornment position="start">₹</InputAdornment> } }}
        />
        <TextField label="Reason" required multiline minRows={2} value={reason} onChange={(event) => setReason(event.target.value)} helperText="Kept with the refund and in the activity log." disabled={busy} slotProps={{ htmlInput: { maxLength: 300 } }} />
      </DialogContent>
      <DialogActions sx={styles.actions}>
        <Button onClick={onClose} disabled={busy}>
          Cancel
        </Button>
        <Button type="submit" color="error" variant="contained" disabled={busy || reason.trim().length < 5}>
          {busy ? "Refunding…" : "Refund"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
