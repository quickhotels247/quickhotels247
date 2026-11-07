"use client";

import { useEffect, useState, type FormEvent } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import FormControlLabel from "@mui/material/FormControlLabel";
import InputAdornment from "@mui/material/InputAdornment";
import MenuItem from "@mui/material/MenuItem";
import Switch from "@mui/material/Switch";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import type { Coupon, CouponInput } from "@quickhotels/types/coupons";
import { adminApi } from "@/lib/api/admin";
import { useRequest } from "@/lib/hooks/useRequest";
import { styles } from "./CouponDialog.styles";

interface CouponDialogProps {
  open: boolean;
  token: string;
  coupon: Coupon | null;
  onClose: () => void;
  onSaved: (coupons: Coupon[]) => void;
}

const today = () => new Date().toISOString().slice(0, 10);
const inMonth = () => new Date(Date.now() + 30 * 86_400_000).toISOString().slice(0, 10);

interface Form {
  code: string;
  title: string;
  description: string;
  product: "" | "HOTEL" | "FLIGHT";
  discountType: "PERCENTAGE" | "FIXED";
  value: string;
  maxDiscount: string;
  minBookingAmount: string;
  validFrom: string;
  validTo: string;
  usageLimit: string;
  perUserLimit: string;
  destinations: string;
  public: boolean;
  status: CouponInput["status"];
}

const empty = (): Form => ({
  code: "", title: "", description: "", product: "HOTEL", discountType: "PERCENTAGE", value: "10", maxDiscount: "1000", minBookingAmount: "",
  validFrom: today(), validTo: inMonth(), usageLimit: "", perUserLimit: "1", destinations: "", public: false, status: "ACTIVE",
});
const fromCoupon = (c: Coupon): Form => ({
  code: c.code, title: c.title ?? "", description: c.description ?? "", product: c.product ?? "", discountType: c.discountType, value: String(c.value),
  maxDiscount: c.maxDiscount?.toString() ?? "", minBookingAmount: c.minBookingAmount?.toString() ?? "", validFrom: c.validFrom, validTo: c.validTo,
  usageLimit: c.usageLimit?.toString() ?? "", perUserLimit: c.perUserLimit?.toString() ?? "", destinations: c.eligibleDestinations.join(", "), public: c.public, status: c.status,
});
const numOrNull = (value: string) => (value.trim() ? Number(value) : null);
const digits = (value: string) => value.replace(/[^\d.]/g, "");

// Create or edit a coupon code.
export default function CouponDialog({ open, token, coupon, onClose, onSaved }: CouponDialogProps) {
  const [form, setForm] = useState<Form>(empty);
  const { busy, error, setError, run } = useRequest();
  const set = (changes: Partial<Form>) => setForm((previous) => ({ ...previous, ...changes }));

  useEffect(() => {
    if (!open) return;
    setForm(coupon ? fromCoupon(coupon) : empty());
    setError("");
  }, [open, coupon, setError]);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const body: CouponInput = {
      code: form.code.trim().toUpperCase(),
      title: form.title.trim() || null,
      description: form.description.trim() || null,
      product: form.product || null,
      discountType: form.discountType,
      value: Number(form.value),
      maxDiscount: form.discountType === "PERCENTAGE" ? numOrNull(form.maxDiscount) : null,
      minBookingAmount: numOrNull(form.minBookingAmount),
      validFrom: form.validFrom,
      validTo: form.validTo,
      usageLimit: numOrNull(form.usageLimit),
      perUserLimit: numOrNull(form.perUserLimit),
      eligibleDestinations: form.product === "FLIGHT" ? [] : form.destinations.split(",").map((part) => part.trim()).filter(Boolean),
      public: form.public,
      status: form.status,
    };
    if (!body.value) return setError("Enter the discount.");
    void run(async () => onSaved(coupon ? await adminApi.updateCoupon(token, coupon.id, body) : await adminApi.createCoupon(token, body)));
  }

  return (
    <Dialog open={open} onClose={busy ? undefined : onClose} fullWidth maxWidth="sm" slotProps={{ paper: { component: "form", onSubmit: submit } as object }}>
      <DialogTitle>{coupon ? `Edit ${coupon.code}` : "New coupon"}</DialogTitle>
      <DialogContent sx={styles.content}>
        {error && <Alert severity="error">{error}</Alert>}
        <Box sx={styles.pair}>
          <TextField label="Code" required value={form.code} onChange={(event) => set({ code: event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "") })} helperText="Letters and numbers, e.g. GOA500" disabled={busy} slotProps={{ htmlInput: { maxLength: 20 } }} />
          <TextField select label="For" value={form.product} onChange={(event) => set({ product: event.target.value as Form["product"] })} disabled={busy}>
            <MenuItem value="HOTEL">Hotels</MenuItem>
            <MenuItem value="FLIGHT">Flights</MenuItem>
            <MenuItem value="">Hotels and flights</MenuItem>
          </TextField>
        </Box>
        <Box sx={styles.three}>
          <TextField select label="Discount" value={form.discountType} onChange={(event) => set({ discountType: event.target.value as Form["discountType"] })} disabled={busy}>
            <MenuItem value="PERCENTAGE">Percentage</MenuItem>
            <MenuItem value="FIXED">Fixed ₹</MenuItem>
          </TextField>
          <TextField
            label="Amount"
            required
            value={form.value}
            onChange={(event) => set({ value: digits(event.target.value) })}
            inputMode="decimal"
            disabled={busy}
            slotProps={{ input: form.discountType === "PERCENTAGE" ? { endAdornment: <InputAdornment position="end">%</InputAdornment> } : { startAdornment: <InputAdornment position="start">₹</InputAdornment> } }}
          />
          {form.discountType === "PERCENTAGE" && (
            <TextField label="Max discount" value={form.maxDiscount} onChange={(event) => set({ maxDiscount: digits(event.target.value) })} inputMode="decimal" helperText="Optional" disabled={busy} slotProps={{ input: { startAdornment: <InputAdornment position="start">₹</InputAdornment> } }} />
          )}
        </Box>
        <Box sx={styles.three}>
          <TextField label="Starts" type="date" required value={form.validFrom} onChange={(event) => set({ validFrom: event.target.value })} disabled={busy} slotProps={{ inputLabel: { shrink: true } }} />
          <TextField label="Ends" type="date" required value={form.validTo} onChange={(event) => set({ validTo: event.target.value })} disabled={busy} slotProps={{ inputLabel: { shrink: true } }} />
          <TextField label="Minimum booking" value={form.minBookingAmount} onChange={(event) => set({ minBookingAmount: digits(event.target.value) })} inputMode="decimal" helperText="Optional" disabled={busy} slotProps={{ input: { startAdornment: <InputAdornment position="start">₹</InputAdornment> } }} />
        </Box>
        <Box sx={styles.pair}>
          <TextField label="Total uses" value={form.usageLimit} onChange={(event) => set({ usageLimit: event.target.value.replace(/\D/g, "") })} helperText="Empty: no limit" disabled={busy} />
          <TextField label="Uses per customer" value={form.perUserLimit} onChange={(event) => set({ perUserLimit: event.target.value.replace(/\D/g, "") })} helperText="Needs sign-in. Empty: no limit" disabled={busy} />
        </Box>
        {form.product !== "FLIGHT" && (
          <TextField label="Only in these hotel cities" value={form.destinations} onChange={(event) => set({ destinations: event.target.value })} helperText="Optional, comma separated (as on the hotel), e.g. Panaji, Calangute" disabled={busy} />
        )}
        <FormControlLabel control={<Switch checked={form.public} onChange={(event) => set({ public: event.target.checked })} disabled={busy} />} label="Show on the Home page Offers" />
        {form.public && (
          <>
            <TextField label="Offer title" required value={form.title} onChange={(event) => set({ title: event.target.value })} placeholder="e.g. Weekend in Goa" disabled={busy} slotProps={{ htmlInput: { maxLength: 80 } }} />
            <TextField label="Offer text" value={form.description} onChange={(event) => set({ description: event.target.value })} placeholder="Optional, e.g. Beach stays for the long weekend." disabled={busy} slotProps={{ htmlInput: { maxLength: 300 } }} />
          </>
        )}
        <TextField select label="Status" value={form.status} onChange={(event) => set({ status: event.target.value as Form["status"] })} disabled={busy}>
          <MenuItem value="ACTIVE">Active</MenuItem>
          <MenuItem value="DRAFT">Draft</MenuItem>
          <MenuItem value="INACTIVE">Off</MenuItem>
        </TextField>
        <Typography sx={styles.note}>A coupon never takes off more than your markup on that booking, so you never sell below TripJack&apos;s net price.</Typography>
      </DialogContent>
      <DialogActions sx={styles.actions}>
        <Button onClick={onClose} disabled={busy}>
          Cancel
        </Button>
        <Button type="submit" variant="contained" disabled={busy}>
          {busy ? "Saving…" : "Save coupon"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
