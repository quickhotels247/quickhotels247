"use client";

import { useState } from "react";
import Link from "next/link";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import MuiLink from "@mui/material/Link";
import Typography from "@mui/material/Typography";
import type { AccountSecurity, Identity } from "@quickhotels/types/users";
import { routes } from "@/config/navigation";
import { accountApi } from "@/lib/api/auth";
import { useGoogleSignIn } from "@/lib/auth/useGoogleSignIn";
import { styles } from "./SignInMethodsCard.styles";

interface SignInMethodsCardProps {
  security: AccountSecurity;
  token: string;
  accountEmail: string;
  onChange: (security: AccountSecurity) => void;
}

// Email and password, and Google: connect or disconnect it. A connected
// Google account may use a different email from the account's.
export default function SignInMethodsCard({ security, token, accountEmail, onChange }: SignInMethodsCardProps) {
  const startGoogle = useGoogleSignIn();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");
  const google = security.identities.filter((identity) => identity.provider === "google");
  // Removing the only way in would lock the customer out.
  const isLastMethod = !security.hasPassword && security.identities.length === 1;

  async function connect() {
    setBusy("connect");
    setError("");
    try {
      await startGoogle(routes.accountSecurity, "connect");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Couldn't start connecting Google.");
      setBusy(null);
    }
  }

  async function disconnect(identity: Identity) {
    setBusy(identity.id);
    setError("");
    try {
      onChange(await accountApi.disconnect(token, identity.id));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Couldn't disconnect Google.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <Box component="section" aria-labelledby="methods-title" sx={styles.root}>
      <Typography component="h2" id="methods-title" sx={styles.title}>
        Sign-in methods
      </Typography>
      {error && <Alert severity="error">{error}</Alert>}

      <Box sx={styles.method}>
        <Box>
          <Typography sx={styles.methodName}>Email and password</Typography>
          <Typography sx={styles.methodText}>
            {accountEmail}. To change your password, use{" "}
            <MuiLink component={Link} href={routes.login}>
              Forgot password
            </MuiLink>{" "}
            on the log-in page.
          </Typography>
        </Box>
      </Box>

      <Box sx={styles.method}>
        <Box sx={styles.methodMain}>
          <Typography sx={styles.methodName}>
            Google {google.length > 0 && <Chip label="Connected" size="small" color="success" variant="outlined" sx={styles.chip} />}
          </Typography>
          {google.length === 0 && <Typography sx={styles.methodText}>Sign in with one click using your Google account.</Typography>}
          {google.map((identity) => (
            <Typography key={identity.id} sx={styles.methodText}>
              {identity.email ?? "Google account"}
            </Typography>
          ))}
        </Box>
        {google.length > 0 ? (
          google.map((identity) => (
            <Button
              key={identity.id}
              variant="outlined"
              color="error"
              onClick={() => disconnect(identity)}
              disabled={busy !== null || isLastMethod}
              title={isLastMethod ? "It's your only way to sign in." : undefined}
            >
              {busy === identity.id ? "Disconnecting…" : "Disconnect"}
            </Button>
          ))
        ) : (
          <Button variant="outlined" onClick={connect} disabled={busy !== null}>
            {busy === "connect" ? "Opening Google…" : "Connect"}
          </Button>
        )}
      </Box>
    </Box>
  );
}
