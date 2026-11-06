"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import MuiLink from "@mui/material/Link";
import TextField from "@mui/material/TextField";
import AdminAuthCard from "@/components/admin/AdminAuthCard";
import { routes } from "@/config/navigation";
import { adminApi } from "@/lib/api/admin";
import { useAdminAuth } from "@/lib/admin/AdminAuthProvider";
import { useRequest } from "@/lib/hooks/useRequest";
import { styles } from "./AdminLoginPage.styles";

// Admin sign-in. While no admin exists yet, it points to first-admin setup.
export default function AdminLoginPage() {
  const router = useRouter();
  const { status, startSession } = useAdminAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [setupNeeded, setSetupNeeded] = useState(false);
  const { busy, error, run } = useRequest();

  useEffect(() => {
    if (status === "authenticated") router.replace(routes.admin);
  }, [status, router]);

  useEffect(() => {
    const controller = new AbortController();
    adminApi
      .setupStatus(controller.signal)
      .then((setup) => setSetupNeeded(setup.setupNeeded))
      .catch(() => undefined);
    return () => controller.abort();
  }, []);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void run(async () => {
      startSession(await adminApi.login({ email: email.trim().toLowerCase(), password }));
      router.replace(routes.admin);
    });
  }

  return (
    <AdminAuthCard title="Admin sign in" subtitle="For the QuickHotels24/7 team only.">
      {setupNeeded && (
        <Alert severity="info">
          No admin account exists yet.{" "}
          <MuiLink component={Link} href={routes.adminSetup}>
            Create the first admin
          </MuiLink>
          .
        </Alert>
      )}
      <Box component="form" onSubmit={submit} sx={styles.form}>
        {error && <Alert severity="error">{error}</Alert>}
        <TextField label="Email" type="email" autoComplete="username" autoFocus required value={email} onChange={(event) => setEmail(event.target.value)} disabled={busy} />
        <TextField label="Password" type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} disabled={busy} />
        <Button type="submit" variant="contained" size="large" disabled={busy || !email || !password}>
          {busy ? "Signing in…" : "Sign in"}
        </Button>
      </Box>
    </AdminAuthCard>
  );
}
