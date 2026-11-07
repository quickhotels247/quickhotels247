"use client";

import { useState, type FormEvent } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { adminApi } from "@/lib/api/admin";
import { useApiData } from "@/lib/hooks/useApiData";
import { useRequest } from "@/lib/hooks/useRequest";
import { styles } from "./EmailTestCard.styles";

// Shows whether email sending is set up and sends a test email.
export default function EmailTestCard({ token, defaultTo }: { token: string; defaultTo: string }) {
  const { data } = useApiData((signal) => adminApi.mailStatus(token, signal), [token]);
  const [to, setTo] = useState(defaultTo);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const { busy, error, run } = useRequest();

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSentTo(null);
    void run(async () => {
      await adminApi.testEmail(token, to.trim());
      setSentTo(to.trim());
    });
  }

  return (
    <Box component="form" onSubmit={submit} sx={styles.card}>
      <Box sx={styles.head}>
        <Typography component="h2" sx={styles.title}>
          Email
        </Typography>
        {data && <Chip size="small" label={data.configured ? "Sending is set up" : "Not set up"} color={data.configured ? "success" : "warning"} variant="outlined" />}
      </Box>
      <Typography sx={styles.text}>Customers get emails (welcome, bookings) from the address in MAIL_FROM. Send a test to check it reaches an inbox.</Typography>
      {error && <Alert severity="error">{error}</Alert>}
      {sentTo && <Alert severity="success">Test email sent to {sentTo}. Check the inbox (and spam).</Alert>}
      <Box sx={styles.row}>
        <TextField label="Send to" type="email" size="small" required value={to} onChange={(event) => setTo(event.target.value)} disabled={busy} sx={styles.field} />
        <Button type="submit" variant="outlined" disabled={busy || !to.trim()}>
          {busy ? "Sending…" : "Send test email"}
        </Button>
      </Box>
    </Box>
  );
}
