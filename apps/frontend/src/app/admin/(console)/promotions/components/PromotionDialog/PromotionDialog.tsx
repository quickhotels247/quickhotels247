"use client";

import { useEffect, useState, type FormEvent } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import InputAdornment from "@mui/material/InputAdornment";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import type { Promotion, PromotionInput } from "@quickhotels/types/pricing";
import { adminApi } from "@/lib/api/admin";
import { formatPrice } from "@/lib/format";
import { useRequest } from "@/lib/hooks/useRequest";
import { styles } from "./PromotionDialog.styles";

interface PromotionDialogProps {
  open: boolean;
  token: string;
  promotion: Promotion | null;
  onClose: () => void;
  onSaved: (promotions: Promotion[]) => void;
}

const inr = (amount: number) => formatPrice({ amount, currency: "INR" });
const empty = (): PromotionInput => ({ name: "", discountType: "PERCENTAGE", value: 5, maxDiscount: null, validFrom: null, validTo: null, status: "ACTIVE" });
const fromPromotion = (p: Promotion): PromotionInput => ({ name: p.name, discountType: p.discountType, value: p.value, maxDiscount: p.maxDiscount, validFrom: p.validFrom, validTo: p.validTo, status: p.status });

// The example in the preview: a ₹2,007 net room with a 9% markup (₹2,188).
const SAMPLE_NET = 2007;
const SAMPLE_MARKUP_PERCENT = 9;

// Add or edit a promotion, with a preview of what customers see.
export default function PromotionDialog({ open, token, promotion, onClose, onSaved }: PromotionDialogProps) {
  const [form, setForm] = useState<PromotionInput>(empty);
  const [valueText, setValueText] = useState("5");
  const [maxText, setMaxText] = useState("");
  const { busy, error, setError, run } = useRequest();
  const set = (changes: Partial<PromotionInput>) => setForm((previous) => ({ ...previous, ...changes }));

  useEffect(() => {
    if (!open) return;
    const start = promotion ? fromPromotion(promotion) : empty();
    setForm(start);
    setValueText(String(start.value));
    setMaxText(start.maxDiscount ? String(start.maxDiscount) : "");
    setError("");
  }, [open, promotion, setError]);

  const value = Number(valueText);
  const max = maxText ? Number(maxText) : null;
  // Same sums as the server: whole rupees, never more than the markup.
  const regular = Math.ceil(SAMPLE_NET * (1 + SAMPLE_MARKUP_PERCENT / 100));
  const markup = regular - SAMPLE_NET;
  let raw = form.discountType === "PERCENTAGE" ? (regular * (Number.isFinite(value) ? value : 0)) / 100 : Number.isFinite(value) ? value : 0;
  if (form.discountType === "PERCENTAGE" && max) raw = Math.min(raw, max);
  const off = Math.max(0, Math.floor(Math.min(raw, markup)));
  const capped = raw > markup;

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!Number.isFinite(value) || value <= 0) return setError("Enter the discount as a number.");
    if (max !== null && (!Number.isFinite(max) || max <= 0)) return setError("Enter the maximum discount as a number, or leave it empty.");
    const body: PromotionInput = { ...form, name: form.name.trim(), value, maxDiscount: form.discountType === "PERCENTAGE" ? max : null };
    void run(async () => onSaved(promotion ? await adminApi.updatePromotion(token, promotion.id, body) : await adminApi.createPromotion(token, body)));
  }

  return (
    <Dialog open={open} onClose={busy ? undefined : onClose} fullWidth maxWidth="sm" slotProps={{ paper: { component: "form", onSubmit: submit } as object }}>
      <DialogTitle>{promotion ? "Edit promotion" : "New promotion"}</DialogTitle>
      <DialogContent sx={styles.content}>
        {error && <Alert severity="error">{error}</Alert>}
        <TextField label="Name customers see" required value={form.name} onChange={(event) => set({ name: event.target.value })} placeholder="e.g. Winter sale" disabled={busy} slotProps={{ htmlInput: { maxLength: 60 } }} />
        <Box sx={styles.pair}>
          <TextField select label="Discount type" value={form.discountType} onChange={(event) => set({ discountType: event.target.value as PromotionInput["discountType"] })} disabled={busy}>
            <MenuItem value="PERCENTAGE">Percentage of the regular price</MenuItem>
            <MenuItem value="FIXED">Fixed ₹ per booking</MenuItem>
          </TextField>
          <TextField
            label="Discount"
            required
            value={valueText}
            onChange={(event) => setValueText(event.target.value.replace(/[^\d.]/g, ""))}
            inputMode="decimal"
            disabled={busy}
            slotProps={{
              input: form.discountType === "PERCENTAGE"
                ? { endAdornment: <InputAdornment position="end">%</InputAdornment> }
                : { startAdornment: <InputAdornment position="start">₹</InputAdornment> },
            }}
          />
        </Box>
        {form.discountType === "PERCENTAGE" && (
          <TextField
            label="Maximum discount per booking"
            value={maxText}
            onChange={(event) => setMaxText(event.target.value.replace(/[^\d.]/g, ""))}
            inputMode="decimal"
            helperText="Optional, e.g. 500"
            disabled={busy}
            slotProps={{ input: { startAdornment: <InputAdornment position="start">₹</InputAdornment> } }}
          />
        )}
        <Box sx={styles.preview}>
          <Typography sx={styles.previewText}>
            Example: a {inr(SAMPLE_NET)} TripJack room with your {SAMPLE_MARKUP_PERCENT}% markup shows{" "}
            <Box component="span" sx={styles.strike}>{inr(regular)}</Box> <b>{inr(regular - off)}</b>
            {off > 0 ? ` (${Math.max(1, Math.round((off / regular) * 100))}% off).` : " (no discount)."}
          </Typography>
          {capped && (
            <Typography sx={styles.previewText}>
              Capped at the {inr(markup)} markup: a promotion never takes a price below TripJack&apos;s net.
            </Typography>
          )}
        </Box>
        <Box sx={styles.pair}>
          <TextField label="Starts" type="date" value={form.validFrom ?? ""} onChange={(event) => set({ validFrom: event.target.value || null })} disabled={busy} slotProps={{ inputLabel: { shrink: true } }} helperText="Optional" />
          <TextField label="Ends" type="date" value={form.validTo ?? ""} onChange={(event) => set({ validTo: event.target.value || null })} disabled={busy} slotProps={{ inputLabel: { shrink: true } }} helperText="Optional, last day included" />
        </Box>
        <TextField select label="Status" value={form.status} onChange={(event) => set({ status: event.target.value as PromotionInput["status"] })} disabled={busy} helperText="Only active promotions change prices.">
          <MenuItem value="ACTIVE">Active</MenuItem>
          <MenuItem value="DRAFT">Draft</MenuItem>
          <MenuItem value="INACTIVE">Off</MenuItem>
        </TextField>
      </DialogContent>
      <DialogActions sx={styles.actions}>
        <Button onClick={onClose} disabled={busy}>
          Cancel
        </Button>
        <Button type="submit" variant="contained" disabled={busy}>
          {busy ? "Saving…" : "Save promotion"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
