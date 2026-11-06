"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import TextField from "@mui/material/TextField";
import type { AdminSetupStatus } from "@quickhotels/types/admin";
import AdminAuthCard from "@/components/admin/AdminAuthCard";
import { routes } from "@/config/navigation";
import { adminApi } from "@/lib/api/admin";
import { useAdminAuth } from "@/lib/admin/AdminAuthProvider";
import { useRequest } from "@/lib/hooks/useRequest";
import { styles } from "./AdminSetupPage.styles";

// Creates the first admin, only while none exists. In production the
// server's ADMIN_SETUP_TOKEN is asked for, so only the owner can do it.
export default function AdminSetupPage() {
  const router = useRouter();
  const { startSession } = useAdminAuth();
  const [setup, setSetup] = useState<AdminSetupStatus | null>(null);
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "", setupToken: "" });
  const { busy, error, setError, run } = useRequest();
  const set = (changes: Partial<typeof form>) => setForm((previous) => ({ ...previous, ...changes }));

  useEffect(() => {
    const controller = new AbortController();
    adminApi.setupStatus(controller.signal).then(setSetup).catch((caught: Error) => setError(caught.message));
    return () => controller.abort();
  }, [setError]);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (form.password !== form.confirm) return setError("The passwords don't match.");
    void run(async () => {
      startSession(
        await adminApi.setup({
          name: form.name.trim(),
          email: form.email.trim().toLowerCase(),
          password: form.password,
          ...(setup?.tokenRequired ? { setupToken: form.setupToken.trim() } : {}),
        }),
      );
      router.replace(routes.admin);
    });
  }

  if (!setup && !error) {
    return (
      <AdminAuthCard title="Set up the admin console" subtitle="Checking…">
        <CircularProgress sx={styles.spinner} />
      </AdminAuthCard>
    );
  }
  if (setup && !setup.setupNeeded) {
    return (
      <AdminAuthCard title="Already set up" subtitle="An admin account exists. Ask an admin to add you to the team.">
        <Button variant="contained" component={Link} href={routes.adminLogin}>
          Go to admin sign in
        </Button>
      </AdminAuthCard>
    );
  }
  return (
    <AdminAuthCard title="Create the first admin" subtitle="This account can then add the rest of the team.">
      <Box component="form" onSubmit={submit} sx={styles.form}>
        {error && <Alert severity="error">{error}</Alert>}
        <TextField label="Your name" autoComplete="name" required value={form.name} onChange={(event) => set({ name: event.target.value })} disabled={busy} />
        <TextField label="Email" type="email" autoComplete="username" required value={form.email} onChange={(event) => set({ email: event.target.value })} disabled={busy} />
        <TextField label="Password" type="password" autoComplete="new-password" required value={form.password} onChange={(event) => set({ password: event.target.value })} helperText="At least 12 characters." disabled={busy} />
        <TextField label="Confirm password" type="password" autoComplete="new-password" required value={form.confirm} onChange={(event) => set({ confirm: event.target.value })} disabled={busy} />
        {setup?.tokenRequired && (
          <TextField label="Setup token" required value={form.setupToken} onChange={(event) => set({ setupToken: event.target.value })} helperText="ADMIN_SETUP_TOKEN from the server's settings." disabled={busy} />
        )}
        <Button type="submit" variant="contained" size="large" disabled={busy}>
          {busy ? "Creating…" : "Create admin account"}
        </Button>
      </Box>
    </AdminAuthCard>
  );
}
