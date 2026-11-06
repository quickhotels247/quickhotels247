"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { routes } from "@/config/navigation";
import { accountApi } from "@/lib/api/auth";
import { useAuth } from "@/lib/auth/useAuth";
import { useRequest } from "@/lib/hooks/useRequest";
import { styles } from "./DeleteAccountCard.styles";

// Closing the account, with the email typed to confirm. Past bookings stay on
// record (without personal details) for invoices and refunds.
export default function DeleteAccountCard({ token, email }: { token: string; email: string }) {
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const { busy, error, run } = useRequest();
  const { logout } = useAuth();
  const router = useRouter();
  const matches = typed.trim().toLowerCase() === email.toLowerCase();

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void run(async () => {
      await accountApi.deleteAccount(token, typed.trim());
      await logout();
      router.replace(routes.home);
    });
  }

  return (
    <Box component="section" aria-labelledby="delete-title" sx={styles.root}>
      <Box>
        <Typography component="h2" id="delete-title" sx={styles.title}>
          Delete account
        </Typography>
        <Typography sx={styles.text}>Permanently close your account and remove your profile, saved travellers and sign-in methods.</Typography>
      </Box>
      <Button color="error" variant="outlined" onClick={() => setOpen(true)} sx={styles.button}>
        Delete account
      </Button>
      <Dialog open={open} onClose={busy ? undefined : () => setOpen(false)} fullWidth maxWidth="xs" slotProps={{ paper: { component: "form", onSubmit: submit } as object }}>
        <DialogTitle>Delete your account?</DialogTitle>
        <DialogContent sx={styles.content}>
          {error && <Alert severity="error">{error}</Alert>}
          <Typography sx={styles.text}>
            This can&apos;t be undone. Your profile, saved travellers and sign-in methods are removed and you&apos;re signed out everywhere. Records of past bookings are kept without your personal profile, as the law requires for invoices.
          </Typography>
          <Typography sx={styles.text}>You can&apos;t delete the account while a booking is upcoming or in progress.</Typography>
          <TextField
            label={`Type ${email} to confirm`}
            value={typed}
            onChange={(event) => setTyped(event.target.value)}
            autoComplete="off"
            disabled={busy}
            slotProps={{ htmlInput: { spellCheck: false, autoCapitalize: "none" } }}
          />
        </DialogContent>
        <DialogActions sx={styles.actions}>
          <Button onClick={() => setOpen(false)} disabled={busy}>
            Cancel
          </Button>
          <Button type="submit" color="error" variant="contained" disabled={busy || !matches}>
            {busy ? "Deleting…" : "Delete account"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
