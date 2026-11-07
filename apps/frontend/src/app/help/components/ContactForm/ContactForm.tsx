"use client";

import { useEffect, useState, type FormEvent } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import CheckCircleRounded from "@mui/icons-material/CheckCircleRounded";
import type { SupportTopic } from "@quickhotels/types/support";
import { supportApi } from "@/lib/api/support";
import { useAuth } from "@/lib/auth/useAuth";
import { useRequest } from "@/lib/hooks/useRequest";
import { styles } from "./ContactForm.styles";

const TOPICS: { value: SupportTopic; label: string }[] = [
  { value: "booking", label: "A booking" },
  { value: "cancellation", label: "Cancelling or changing a booking" },
  { value: "payment", label: "Payment or refund" },
  { value: "flight", label: "Flights" },
  { value: "account", label: "My account" },
  { value: "other", label: "Something else" },
];

const empty = { name: "", email: "", phone: "", topic: "booking" as SupportTopic, bookingReference: "", message: "" };

// "Contact us": creates a support request and shows its number.
export default function ContactForm() {
  const { user, token } = useAuth();
  const [form, setForm] = useState(empty);
  const [sent, setSent] = useState<string | null>(null);
  const { busy, error, run } = useRequest();
  const set = (changes: Partial<typeof empty>) => setForm((previous) => ({ ...previous, ...changes }));

  // Signed in: fill in who's writing (only empty fields).
  useEffect(() => {
    if (!user) return;
    setForm((previous) => ({
      ...previous,
      name: previous.name || `${user.firstName} ${user.lastName}`.trim(),
      email: previous.email || user.email,
      phone: previous.phone || (user.phone ?? ""),
    }));
  }, [user]);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void run(async () => {
      const { reference } = await supportApi.createTicket(
        { ...form, phone: form.phone.trim() || null, bookingReference: form.bookingReference.trim() || null },
        token,
      );
      setSent(reference);
      setForm({ ...empty, name: form.name, email: form.email, phone: form.phone });
    });
  }

  if (sent) {
    return (
      <Box sx={[styles.card, styles.done]} role="status">
        <CheckCircleRounded color="success" sx={styles.doneIcon} />
        <Typography component="h3" sx={styles.doneTitle}>
          Thanks, we&apos;ve got your message
        </Typography>
        <Typography sx={styles.text}>
          Your request number is <b>{sent}</b>. We&apos;ve emailed you a copy and will reply to {form.email}.
        </Typography>
        <Button onClick={() => setSent(null)}>Send another message</Button>
      </Box>
    );
  }

  return (
    <Box component="form" onSubmit={submit} sx={styles.card} aria-labelledby="contact-title">
      <Typography component="h2" id="contact-title" sx={styles.title}>
        Contact us
      </Typography>
      <Typography sx={styles.text}>Didn&apos;t find your answer? Send us a message and we&apos;ll reply by email.</Typography>
      {error && <Alert severity="error">{error}</Alert>}
      <Box sx={styles.pair}>
        <TextField label="Your name" required autoComplete="name" value={form.name} onChange={(event) => set({ name: event.target.value })} disabled={busy} slotProps={{ htmlInput: { maxLength: 80 } }} />
        <TextField label="Email" type="email" required autoComplete="email" value={form.email} onChange={(event) => set({ email: event.target.value })} disabled={busy} />
      </Box>
      <Box sx={styles.pair}>
        <TextField select label="What's it about?" value={form.topic} onChange={(event) => set({ topic: event.target.value as SupportTopic })} disabled={busy}>
          {TOPICS.map((topic) => (
            <MenuItem key={topic.value} value={topic.value}>
              {topic.label}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          label="Booking reference"
          value={form.bookingReference}
          onChange={(event) => set({ bookingReference: event.target.value.toUpperCase() })}
          helperText="Optional, e.g. QH-7K2M9P"
          disabled={busy}
          slotProps={{ htmlInput: { maxLength: 30 } }}
        />
      </Box>
      <TextField label="Phone" type="tel" autoComplete="tel" value={form.phone} onChange={(event) => set({ phone: event.target.value })} helperText="Optional, if a call is easier" disabled={busy} sx={styles.phone} />
      <TextField
        label="Your message"
        required
        multiline
        minRows={5}
        value={form.message}
        onChange={(event) => set({ message: event.target.value })}
        disabled={busy}
        slotProps={{ htmlInput: { maxLength: 4000 } }}
        helperText={`${form.message.length}/4000`}
      />
      <Button type="submit" variant="contained" size="large" disabled={busy} sx={styles.submit}>
        {busy ? "Sending…" : "Send message"}
      </Button>
    </Box>
  );
}
