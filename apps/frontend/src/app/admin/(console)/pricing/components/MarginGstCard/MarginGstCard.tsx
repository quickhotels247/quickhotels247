"use client";

import { useEffect, useState, type FormEvent } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import InputAdornment from "@mui/material/InputAdornment";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { adminApi } from "@/lib/api/admin";
import { useApiData } from "@/lib/hooks/useApiData";
import { useRequest } from "@/lib/hooks/useRequest";
import { styles } from "./MarginGstCard.styles";

// GST on our hotel margin (agent model): added to "Taxes and fees", owed to
// the government, and kept out of earnings. 0% turns it off.
export default function MarginGstCard({ token }: { token: string }) {
  const { data } = useApiData((signal) => adminApi.marginGst(token, signal), [token]);
  const [text, setText] = useState("");
  const [saved, setSaved] = useState<number | null>(null);
  const { busy, error, setError, run } = useRequest();
  useEffect(() => {
    if (data) setText(String(data.percent));
  }, [data]);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const percent = Number(text);
    if (!Number.isFinite(percent) || percent < 0 || percent > 28) return setError("Enter a percentage from 0 to 28.");
    setSaved(null);
    void run(async () => setSaved((await adminApi.saveMarginGst(token, percent)).percent));
  }

  return (
    <Box component="form" onSubmit={submit} sx={styles.card}>
      <Typography component="h2" sx={styles.title}>
        GST on your margin (hotels)
      </Typography>
      <Typography sx={styles.text}>
        Added on top of your markup and shown inside &ldquo;Taxes and fees&rdquo;. The hotel&apos;s own GST is already in TripJack&apos;s price. This GST is
        collected for the government, so it isn&apos;t counted in your earnings. Example: ₹10,018 room + 9% (₹902) + 18% of ₹902 (₹162) = ₹11,083.
        Set 0% to turn it off. Confirm the rate with your CA.
      </Typography>
      {error && <Alert severity="error">{error}</Alert>}
      {saved !== null && <Alert severity="success">Saved: {saved}%. New searches use it straight away.</Alert>}
      <Box sx={styles.row}>
        <TextField
          size="small"
          label="GST rate"
          value={text}
          onChange={(event) => {
            setText(event.target.value.replace(/[^\d.]/g, ""));
            setSaved(null);
          }}
          disabled={busy || !data}
          sx={styles.field}
          slotProps={{ input: { endAdornment: <InputAdornment position="end">%</InputAdornment> }, htmlInput: { inputMode: "decimal" } }}
        />
        <Button type="submit" variant="outlined" disabled={busy || !data}>
          {busy ? "Saving…" : "Save"}
        </Button>
      </Box>
    </Box>
  );
}
