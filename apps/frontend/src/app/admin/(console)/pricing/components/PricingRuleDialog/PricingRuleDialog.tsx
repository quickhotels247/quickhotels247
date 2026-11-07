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
import type { PricingProduct, PricingRule, PricingRuleInput, PricingScope } from "@quickhotels/types/pricing";
import { adminApi } from "@/lib/api/admin";
import { useRequest } from "@/lib/hooks/useRequest";
import { inr, preview } from "../../utils/ruleText";
import { styles } from "./PricingRuleDialog.styles";

interface PricingRuleDialogProps {
  open: boolean;
  token: string;
  // Editing this rule, or adding one for this product.
  rule: PricingRule | null;
  product: PricingProduct;
  onClose: () => void;
  onSaved: (rules: PricingRule[]) => void;
}

const SCOPES: Record<PricingProduct, { value: PricingScope; label: string; hint?: string }[]> = {
  HOTEL: [
    { value: "ALL", label: "All hotels" },
    { value: "COUNTRY", label: "A country", hint: "As customers search it, e.g. India" },
    { value: "DESTINATION", label: "A destination", hint: "The searched city or region, e.g. Goa" },
  ],
  FLIGHT: [
    { value: "ALL", label: "All flights" },
    { value: "AIRLINE", label: "One airline", hint: "2-letter code, e.g. 6E (IndiGo), AI (Air India)" },
  ],
};

const empty = (product: PricingProduct): PricingRuleInput => ({
  name: "", product, scope: "ALL", scopeValue: null, markupType: "PERCENTAGE", value: 10, priority: 0, validFrom: null, validTo: null, status: "ACTIVE",
});
const fromRule = (rule: PricingRule): PricingRuleInput => ({
  name: rule.name, product: rule.product, scope: rule.scope, scopeValue: rule.scopeValue, markupType: rule.markupType, value: rule.value,
  priority: rule.priority, validFrom: rule.validFrom?.slice(0, 10) ?? null, validTo: rule.validTo?.slice(0, 10) ?? null, status: rule.status,
});

// Add or edit a markup rule, with a live "customer pays" preview.
export default function PricingRuleDialog({ open, token, rule, product, onClose, onSaved }: PricingRuleDialogProps) {
  const [form, setForm] = useState<PricingRuleInput>(() => empty(product));
  const [valueText, setValueText] = useState("10");
  const { busy, error, setError, run } = useRequest();
  const set = (changes: Partial<PricingRuleInput>) => setForm((previous) => ({ ...previous, ...changes }));

  useEffect(() => {
    if (!open) return;
    const start = rule ? fromRule(rule) : empty(product);
    setForm(start);
    setValueText(String(start.value));
    setError("");
  }, [open, rule, product, setError]);

  const scope = SCOPES[form.product].find((option) => option.value === form.scope);
  const value = Number(valueText);
  const sample = form.product === "HOTEL" ? 10_000 : 5_000;
  const example = Number.isFinite(value) ? preview({ markupType: form.markupType, value }, sample) : null;

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!Number.isFinite(value) || value < 0) return setError("Enter the markup as a number.");
    const body = { ...form, value, scopeValue: form.scope === "ALL" ? null : (form.scopeValue ?? "").trim() || null };
    void run(async () => onSaved(rule ? await adminApi.updatePricingRule(token, rule.id, body) : await adminApi.createPricingRule(token, body)));
  }

  return (
    <Dialog open={open} onClose={busy ? undefined : onClose} fullWidth maxWidth="sm" slotProps={{ paper: { component: "form", onSubmit: submit } as object }}>
      <DialogTitle>{rule ? "Edit markup rule" : `New ${form.product === "HOTEL" ? "hotel" : "flight"} markup rule`}</DialogTitle>
      <DialogContent sx={styles.content}>
        {error && <Alert severity="error">{error}</Alert>}
        <TextField label="Name" required value={form.name} onChange={(event) => set({ name: event.target.value })} placeholder="e.g. Standard hotel markup" disabled={busy} slotProps={{ htmlInput: { maxLength: 80 } }} />
        <Box sx={styles.pair}>
          <TextField select label="Applies to" value={form.scope} onChange={(event) => set({ scope: event.target.value as PricingScope, scopeValue: null })} disabled={busy}>
            {SCOPES[form.product].map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>
          {form.scope !== "ALL" && (
            <TextField
              label={form.scope === "AIRLINE" ? "Airline code" : form.scope === "COUNTRY" ? "Country" : "Destination"}
              required
              value={form.scopeValue ?? ""}
              onChange={(event) => set({ scopeValue: form.scope === "AIRLINE" ? event.target.value.toUpperCase() : event.target.value })}
              helperText={scope?.hint}
              disabled={busy}
              slotProps={{ htmlInput: { maxLength: form.scope === "AIRLINE" ? 3 : 80 } }}
            />
          )}
        </Box>
        <Box sx={styles.pair}>
          <TextField select label="Markup type" value={form.markupType} onChange={(event) => set({ markupType: event.target.value as PricingRuleInput["markupType"] })} disabled={busy}>
            <MenuItem value="PERCENTAGE">Percentage of net price</MenuItem>
            <MenuItem value="FIXED">{form.product === "HOTEL" ? "Fixed ₹ per booking" : "Fixed ₹ per traveller, per flight"}</MenuItem>
          </TextField>
          <TextField
            label="Markup"
            required
            value={valueText}
            onChange={(event) => setValueText(event.target.value.replace(/[^\d.]/g, ""))}
            inputMode="decimal"
            disabled={busy}
            slotProps={{
              input: form.markupType === "PERCENTAGE"
                ? { endAdornment: <InputAdornment position="end">%</InputAdornment> }
                : { startAdornment: <InputAdornment position="start">₹</InputAdornment> },
            }}
          />
        </Box>
        {example && (
          <Box sx={styles.preview}>
            <Typography sx={styles.previewText}>
              On a {inr(sample)} net {form.product === "HOTEL" ? "stay" : "fare (1 traveller)"}, the customer pays <b>{inr(example.sell)}</b> and you earn <b>{inr(example.earn)}</b>.
            </Typography>
          </Box>
        )}
        <Box sx={styles.three}>
          <TextField label="Starts" type="date" value={form.validFrom ?? ""} onChange={(event) => set({ validFrom: event.target.value || null })} disabled={busy} slotProps={{ inputLabel: { shrink: true } }} helperText="Optional" />
          <TextField label="Ends" type="date" value={form.validTo ?? ""} onChange={(event) => set({ validTo: event.target.value || null })} disabled={busy} slotProps={{ inputLabel: { shrink: true } }} helperText="Optional" />
          <TextField label="Priority" type="number" value={form.priority} onChange={(event) => set({ priority: Math.max(-100, Math.min(100, Math.round(Number(event.target.value) || 0))) })} disabled={busy} helperText="Higher wins" />
        </Box>
        <TextField select label="Status" value={form.status} onChange={(event) => set({ status: event.target.value as PricingRuleInput["status"] })} disabled={busy} helperText="Only active rules change prices.">
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
          {busy ? "Saving…" : "Save rule"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
