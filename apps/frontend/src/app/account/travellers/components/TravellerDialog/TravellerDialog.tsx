"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
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
import type { SavedTraveller } from "@quickhotels/types/travellers";
import { travellersApi } from "@/lib/api/auth";
import { countries } from "@/lib/countries";
import { useRequest } from "@/lib/hooks/useRequest";
import { TITLES, emptyTraveller, toForm, toInput, type TravellerFormValue } from "../../utils/travellerForm";
import { styles } from "./TravellerDialog.styles";

interface TravellerDialogProps {
  open: boolean;
  token: string;
  // Editing this traveller, or adding a new one when null.
  traveller: SavedTraveller | null;
  onClose: () => void;
  onSaved: (traveller: SavedTraveller) => void;
}

const today = () => new Date().toISOString().slice(0, 10);

// Add or edit a saved traveller. Names as on their ID; passport is optional
// (needed for international flights).
export default function TravellerDialog({ open, token, traveller, onClose, onSaved }: TravellerDialogProps) {
  const [form, setForm] = useState<TravellerFormValue>(emptyTraveller);
  const { busy, error, setError, run } = useRequest();
  const countryList = useMemo(() => (open ? countries() : []), [open]);
  const set = (changes: Partial<TravellerFormValue>) => setForm((previous) => ({ ...previous, ...changes }));

  useEffect(() => {
    if (!open) return;
    setForm(traveller ? toForm(traveller) : emptyTraveller());
    setError("");
  }, [open, traveller, setError]);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (form.passportExpiry && !form.passportNumber.trim()) return setError("Add the passport number with its expiry date.");
    void run(async () => {
      const input = toInput(form);
      onSaved(traveller ? await travellersApi.update(token, traveller.id, input) : await travellersApi.create(token, input));
    });
  }

  return (
    <Dialog open={open} onClose={busy ? undefined : onClose} fullWidth maxWidth="sm" slotProps={{ paper: { component: "form", onSubmit: submit } as object }}>
      <DialogTitle>{traveller ? "Edit traveller" : "Add a traveller"}</DialogTitle>
      <DialogContent sx={styles.content}>
        {error && <Alert severity="error">{error}</Alert>}
        <Typography sx={styles.hint}>Enter names exactly as on their ID or passport.</Typography>
        <Box sx={styles.names}>
          <TextField select label="Title" required value={form.title} onChange={(event) => set({ title: event.target.value as TravellerFormValue["title"] })} disabled={busy}>
            {TITLES.map((title) => (
              <MenuItem key={title} value={title}>
                {title}
              </MenuItem>
            ))}
          </TextField>
          <TextField label="First name" required autoFocus value={form.firstName} onChange={(event) => set({ firstName: event.target.value })} disabled={busy} slotProps={{ htmlInput: { maxLength: 50 } }} />
          <TextField label="Last name" required value={form.lastName} onChange={(event) => set({ lastName: event.target.value })} disabled={busy} slotProps={{ htmlInput: { maxLength: 50 } }} />
        </Box>
        <Box sx={styles.pair}>
          <TextField
            label="Date of birth"
            type="date"
            value={form.dateOfBirth}
            onChange={(event) => set({ dateOfBirth: event.target.value })}
            helperText="Needed for children and infants on flights."
            disabled={busy}
            slotProps={{ inputLabel: { shrink: true }, htmlInput: { max: today(), min: "1900-01-01" } }}
          />
          <TextField select label="Nationality" value={form.nationality} onChange={(event) => set({ nationality: event.target.value })} disabled={busy}>
            <MenuItem value="">Not set</MenuItem>
            {countryList.map((country) => (
              <MenuItem key={country.code} value={country.code}>
                {country.name}
              </MenuItem>
            ))}
          </TextField>
        </Box>
        <Typography component="h3" sx={styles.section}>
          Passport (optional)
        </Typography>
        <Box sx={styles.pair}>
          <TextField
            label="Passport number"
            value={form.passportNumber}
            onChange={(event) => set({ passportNumber: event.target.value.toUpperCase() })}
            disabled={busy}
            slotProps={{ htmlInput: { maxLength: 12, autoCapitalize: "characters" } }}
          />
          <TextField
            label="Passport expiry"
            type="date"
            value={form.passportExpiry}
            onChange={(event) => set({ passportExpiry: event.target.value })}
            disabled={busy}
            slotProps={{ inputLabel: { shrink: true }, htmlInput: { min: today() } }}
          />
        </Box>
      </DialogContent>
      <DialogActions sx={styles.actions}>
        <Button onClick={onClose} disabled={busy}>
          Cancel
        </Button>
        <Button type="submit" variant="contained" disabled={busy}>
          {busy ? "Saving…" : traveller ? "Save changes" : "Save traveller"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
