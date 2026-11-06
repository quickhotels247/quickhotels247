"use client";

import { useEffect, useState, type FormEvent } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { useRequest } from "@/lib/hooks/useRequest";
import OtpInput from "../OtpInput";
import { styles } from "./VerifyCodeStep.styles";

interface VerifyCodeStepProps {
  email: string;
  // When "Resend code" may be used again (ms since epoch).
  resendAvailableAt: number;
  onVerify: (code: string) => Promise<void>;
  onResend: () => Promise<void>;
  onChangeEmail: () => void;
}

const formatWait = (seconds: number) => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;

// "Enter the 6-digit code we sent to …", with resend after a short wait.
export default function VerifyCodeStep({ email, resendAvailableAt, onVerify, onResend, onChangeEmail }: VerifyCodeStepProps) {
  const [code, setCode] = useState("");
  const [now, setNow] = useState(() => Date.now());
  const [resent, setResent] = useState(false);
  const verifying = useRequest();
  const resending = useRequest();
  const waitSeconds = Math.max(0, Math.ceil((resendAvailableAt - now) / 1000));

  useEffect(() => {
    if (waitSeconds === 0) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [waitSeconds]);

  function verify(value = code) {
    if (value.length !== 6 || verifying.busy || resending.busy) return;
    void verifying.run(() => onVerify(value));
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    verify();
  }

  async function resend() {
    setResent(false);
    verifying.setError("");
    const ok = await resending.run(async () => {
      await onResend();
      return true;
    });
    if (ok) {
      setCode("");
      setResent(true);
      setNow(Date.now());
    }
  }

  const error = verifying.error || resending.error;
  const busy = verifying.busy || resending.busy;
  return (
    <Box component="form" onSubmit={submit} noValidate sx={styles.root}>
      <Typography sx={styles.intro}>
        Enter the 6-digit code we sent to <strong>{email}</strong>.{" "}
        <Button size="small" onClick={onChangeEmail} disabled={busy} sx={styles.change}>
          Change
        </Button>
      </Typography>
      <OtpInput
        value={code}
        onChange={(value) => {
          setCode(value);
          if (verifying.error) verifying.setError("");
        }}
        onComplete={verify}
        disabled={busy}
        invalid={Boolean(verifying.error)}
        autoFocus
      />
      {error && <Alert severity="error">{error}</Alert>}
      {resent && !error && <Alert severity="success">A new code is on its way.</Alert>}
      <Button type="submit" variant="contained" size="large" disabled={code.length !== 6 || busy}>
        {verifying.busy ? "Checking…" : "Verify"}
      </Button>
      <Typography sx={styles.resend}>
        Didn&apos;t get it? Check spam, or{" "}
        {waitSeconds > 0 ? (
          <span>resend in {formatWait(waitSeconds)}</span>
        ) : (
          <Button size="small" onClick={resend} disabled={busy} sx={styles.change}>
            {resending.busy ? "Sending…" : "resend the code"}
          </Button>
        )}
      </Typography>
    </Box>
  );
}
