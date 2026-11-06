"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import MuiLink from "@mui/material/Link";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import type { SignupDetails } from "@quickhotels/types/users";
import { routes } from "@/config/navigation";
import { useGoogleSignIn } from "@/lib/auth/useGoogleSignIn";
import { validateDetails, type DetailsField } from "@/lib/auth/validation";
import { useRequest } from "@/lib/hooks/useRequest";
import GoogleButton from "../../GoogleButton";
import { styles } from "./DetailsStep.styles";

interface DetailsStepProps {
  values: SignupDetails;
  next: string;
  onChange: (values: SignupDetails) => void;
  // Checks the details; rejects with a message to show.
  onContinue: () => Promise<void>;
}

const FIELDS: { field: DetailsField; label: string; autoComplete: string; type?: string }[] = [
  { field: "firstName", label: "First name", autoComplete: "given-name" },
  { field: "lastName", label: "Last name", autoComplete: "family-name" },
  { field: "email", label: "Email", autoComplete: "email", type: "email" },
  { field: "username", label: "Username", autoComplete: "username" },
];

// Sign-up step 1: Google, or name, email and username.
export default function DetailsStep({ values, next, onChange, onContinue }: DetailsStepProps) {
  const [submitted, setSubmitted] = useState(false);
  const [google, setGoogle] = useState(false);
  const { busy, error, run } = useRequest();
  const startGoogle = useGoogleSignIn();
  const errors = validateDetails(values);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
    if (Object.values(errors).some(Boolean)) return;
    void run(onContinue);
  }

  async function continueWithGoogle() {
    setGoogle(true);
    await run(() => startGoogle(next));
    setGoogle(false);
  }

  return (
    <Box component="form" onSubmit={submit} noValidate sx={styles.root}>
      <GoogleButton onClick={continueWithGoogle} pending={google} disabled={busy} />
      {error && <Alert severity="error">{error}</Alert>}
      <Box sx={styles.grid}>
        {FIELDS.map(({ field, label, autoComplete, type }, i) => (
          <TextField
            key={field}
            label={label}
            type={type}
            autoComplete={autoComplete}
            autoFocus={i === 0}
            value={values[field]}
            onChange={(event) => onChange({ ...values, [field]: event.target.value })}
            error={submitted && Boolean(errors[field])}
            helperText={submitted && errors[field] ? errors[field] : field === "username" ? "3–20 letters, numbers, . - or _" : undefined}
            disabled={busy}
            sx={field === "email" || field === "username" ? styles.wide : undefined}
          />
        ))}
      </Box>
      <Button type="submit" variant="contained" size="large" disabled={busy}>
        {busy && !google ? "Checking…" : "Continue"}
      </Button>
      <Typography sx={styles.switch}>
        Already have an account?{" "}
        <MuiLink component={Link} href={`${routes.login}?${new URLSearchParams({ next })}`} sx={styles.link}>
          Log in
        </MuiLink>
      </Typography>
    </Box>
  );
}
