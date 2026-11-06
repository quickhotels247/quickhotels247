"use client";

import { useState, type FormEvent } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { adminApi } from "@/lib/api/admin";
import { useAdminAuth } from "@/lib/admin/AdminAuthProvider";
import { useRequest } from "@/lib/hooks/useRequest";
import { styles } from "./AdminSettingsPage.styles";

// The signed-in admin's account: change password.
export default function AdminSettingsPage() {
  const { admin, token } = useAdminAuth();
  const [form, setForm] = useState({ currentPassword: "", newPassword: "", confirm: "" });
  const [saved, setSaved] = useState(false);
  const { busy, error, setError, run } = useRequest();
  const set = (changes: Partial<typeof form>) => {
    setForm((previous) => ({ ...previous, ...changes }));
    setSaved(false);
  };

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (form.newPassword !== form.confirm) return setError("The new passwords don't match.");
    void run(async () => {
      await adminApi.changePassword(token!, { currentPassword: form.currentPassword, newPassword: form.newPassword });
      setForm({ currentPassword: "", newPassword: "", confirm: "" });
      setSaved(true);
    });
  }

  return (
    <>
      <AdminPageHeader title="Account settings" subtitle={admin ? `${admin.name} · ${admin.email}` : undefined} />
      <Box component="form" onSubmit={submit} sx={styles.card}>
        <Typography component="h2" sx={styles.title}>
          Change password
        </Typography>
        {error && <Alert severity="error">{error}</Alert>}
        {saved && <Alert severity="success">Password changed.</Alert>}
        <TextField label="Current password" type="password" autoComplete="current-password" required value={form.currentPassword} onChange={(event) => set({ currentPassword: event.target.value })} disabled={busy} />
        <TextField label="New password" type="password" autoComplete="new-password" required value={form.newPassword} onChange={(event) => set({ newPassword: event.target.value })} helperText="At least 12 characters." disabled={busy} />
        <TextField label="Confirm new password" type="password" autoComplete="new-password" required value={form.confirm} onChange={(event) => set({ confirm: event.target.value })} disabled={busy} />
        <Button type="submit" variant="contained" disabled={busy} sx={styles.submit}>
          {busy ? "Saving…" : "Change password"}
        </Button>
      </Box>
    </>
  );
}
