"use client";

import { useEffect, useState, type FormEvent } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import type { CompanyGstSetting } from "@quickhotels/types/admin";
import { adminApi } from "@/lib/api/admin";
import { useApiData } from "@/lib/hooks/useApiData";
import { useRequest } from "@/lib/hooks/useRequest";
import { styles } from "./CompanyGstCard.styles";

const GSTIN = /^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;

// Our company's GST registration. TripJack needs it to book hotel rates
// marked RESELLER or PASSTHROUGH; it's sent with those bookings only.
export default function CompanyGstCard({ token }: { token: string }) {
  const { data } = useApiData((signal) => adminApi.companyGst(token, signal), [token]);
  const [setting, setSetting] = useState<CompanyGstSetting | null>(null);
  const [form, setForm] = useState({ gstNumber: "", registeredName: "" });
  const [saved, setSaved] = useState<string | null>(null);
  const { busy, error, setError, run } = useRequest();

  useEffect(() => {
    if (!data) return;
    setSetting(data);
    setForm({ gstNumber: data.gst?.gstNumber ?? "", registeredName: data.gst?.registeredName ?? "" });
  }, [data]);

  const set = (changes: Partial<typeof form>) => {
    setForm((previous) => ({ ...previous, ...changes }));
    setSaved(null);
  };

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const gstNumber = form.gstNumber.trim().toUpperCase();
    if (!GSTIN.test(gstNumber)) return setError("Enter a valid 15-character GSTIN, like 29ABCDE1234F1Z5.");
    void run(async () => {
      setSetting(await adminApi.saveCompanyGst(token, { gstNumber, registeredName: form.registeredName.trim() }));
      setSaved("GST details saved. New hotel bookings use them straight away.");
    });
  }

  function clear() {
    void run(async () => {
      setSetting(await adminApi.clearCompanyGst(token));
      setForm({ gstNumber: "", registeredName: "" });
      setSaved("GST details removed.");
    });
  }

  return (
    <Box component="form" onSubmit={submit} sx={styles.card}>
      <Box sx={styles.head}>
        <Typography component="h2" sx={styles.title}>
          Company GST
        </Typography>
        {setting && <Chip size="small" label={setting.gst ? "Set" : "Not set"} color={setting.gst ? "success" : "warning"} variant="outlined" />}
      </Box>
      <Typography sx={styles.text}>
        Our GST registration, exactly as on the GST certificate. TripJack needs it to book hotel rates marked RESELLER or PASSTHROUGH; without it those bookings may be rejected after the customer pays.
      </Typography>
      {error && <Alert severity="error">{error}</Alert>}
      {saved && <Alert severity="success">{saved}</Alert>}
      <TextField
        label="GSTIN"
        required
        value={form.gstNumber}
        onChange={(event) => set({ gstNumber: event.target.value.toUpperCase() })}
        helperText="15 characters, e.g. 29ABCDE1234F1Z5"
        slotProps={{ htmlInput: { maxLength: 15, autoCapitalize: "characters" } }}
        disabled={busy}
      />
      <TextField
        label="Registered name"
        required
        value={form.registeredName}
        onChange={(event) => set({ registeredName: event.target.value })}
        slotProps={{ htmlInput: { maxLength: 100 } }}
        disabled={busy}
      />
      <Box sx={styles.actions}>
        <Button type="submit" variant="contained" disabled={busy || !form.gstNumber.trim() || !form.registeredName.trim()}>
          {busy ? "Saving…" : "Save GST details"}
        </Button>
        {setting?.gst && (
          <Button color="error" onClick={clear} disabled={busy}>
            Remove
          </Button>
        )}
      </Box>
    </Box>
  );
}
