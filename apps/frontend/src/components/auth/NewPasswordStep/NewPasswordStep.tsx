"use client";

import { useState, type FormEvent } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import LinearProgress from "@mui/material/LinearProgress";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { passwordStrength, validatePassword } from "@/lib/auth/validation";
import { useRequest } from "@/lib/hooks/useRequest";
import { styles } from "./NewPasswordStep.styles";

const STRENGTH = ["Too short", "Weak", "Fair", "Good", "Strong"];
const STRENGTH_COLOR = ["error", "error", "warning", "info", "success"] as const;

interface NewPasswordStepProps {
  email: string;
  submitLabel: string;
  onSubmit: (password: string) => Promise<void>;
  onStartOver: () => void;
}

// Choose a password (and type it again), with a strength meter.
export default function NewPasswordStep({ email, submitLabel, onSubmit, onStartOver }: NewPasswordStepProps) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const { busy, error, run } = useRequest();
  const errors = validatePassword(password, confirmPassword);
  const strength = passwordStrength(password);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
    if (errors.password || errors.confirmPassword) return;
    void run(() => onSubmit(password));
  }

  return (
    <Box component="form" onSubmit={submit} noValidate sx={styles.root}>
      <Typography sx={styles.intro}>
        Choose a password for <strong>{email}</strong>.
      </Typography>
      {error && (
        <Alert
          severity="error"
          action={
            /verif|expired|start/i.test(error) ? (
              <Button color="inherit" size="small" onClick={onStartOver}>
                Start over
              </Button>
            ) : undefined
          }
        >
          {error}
        </Alert>
      )}
      <Box>
        <TextField
          label="Password"
          type="password"
          autoComplete="new-password"
          autoFocus
          fullWidth
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          error={submitted && Boolean(errors.password)}
          helperText={submitted && errors.password ? errors.password : "At least 8 characters. Mix letters, numbers and symbols."}
          disabled={busy}
        />
        {password && (
          <Box sx={styles.strength}>
            <LinearProgress variant="determinate" value={(strength / 4) * 100} color={STRENGTH_COLOR[strength]} sx={styles.bar} />
            <Typography sx={styles.strengthLabel}>{STRENGTH[strength]}</Typography>
          </Box>
        )}
      </Box>
      <TextField
        label="Confirm password"
        type="password"
        autoComplete="new-password"
        fullWidth
        value={confirmPassword}
        onChange={(event) => setConfirmPassword(event.target.value)}
        error={submitted && Boolean(errors.confirmPassword)}
        helperText={submitted ? errors.confirmPassword : undefined}
        disabled={busy}
      />
      <Button type="submit" variant="contained" size="large" disabled={busy}>
        {busy ? "Please wait…" : submitLabel}
      </Button>
    </Box>
  );
}
