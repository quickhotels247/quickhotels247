"use client";

import { useState, type FormEvent } from "react";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import type { AdminAccount, AdminRole } from "@quickhotels/types/admin";
import { ROLE_INFO, ROLES } from "@/lib/admin/roles";
import { adminApi } from "@/lib/api/admin";
import { useRequest } from "@/lib/hooks/useRequest";
import { styles } from "./AddAdminDialog.styles";

interface AddAdminDialogProps {
  open: boolean;
  token: string;
  onClose: () => void;
  onAdded: (admin: AdminAccount) => void;
}

// Adds a teammate with a starting password they should change after signing in.
export default function AddAdminDialog({ open, token, onClose, onAdded }: AddAdminDialogProps) {
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "SUPPORT_AGENT" as AdminRole });
  const { busy, error, run } = useRequest();
  const set = (changes: Partial<typeof form>) => setForm((previous) => ({ ...previous, ...changes }));

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void run(async () => {
      const admin = await adminApi.addAdmin(token, { name: form.name.trim(), email: form.email.trim().toLowerCase(), password: form.password, role: form.role });
      setForm({ name: "", email: "", password: "", role: "SUPPORT_AGENT" });
      onAdded(admin);
    });
  }

  return (
    <Dialog open={open} onClose={busy ? undefined : onClose} fullWidth maxWidth="xs" slotProps={{ paper: { component: "form", onSubmit: submit } as object }}>
      <DialogTitle>Add an admin</DialogTitle>
      <DialogContent sx={styles.content}>
        {error && <Alert severity="error">{error}</Alert>}
        <TextField label="Name" required autoFocus value={form.name} onChange={(event) => set({ name: event.target.value })} disabled={busy} />
        <TextField label="Email" type="email" required value={form.email} onChange={(event) => set({ email: event.target.value })} disabled={busy} />
        <TextField select label="Role" value={form.role} onChange={(event) => set({ role: event.target.value as AdminRole })} helperText={ROLE_INFO[form.role].description} disabled={busy}>
          {ROLES.map((role) => (
            <MenuItem key={role} value={role}>
              {ROLE_INFO[role].label}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          label="Starting password"
          type="password"
          autoComplete="new-password"
          required
          value={form.password}
          onChange={(event) => set({ password: event.target.value })}
          helperText="At least 12 characters. Share it privately; they should change it after signing in."
          disabled={busy}
        />
      </DialogContent>
      <DialogActions sx={styles.actions}>
        <Button onClick={onClose} disabled={busy}>
          Cancel
        </Button>
        <Button type="submit" variant="contained" disabled={busy}>
          {busy ? "Adding…" : "Add admin"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
