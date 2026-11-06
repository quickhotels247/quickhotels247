"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useSignIn } from "@clerk/react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import MuiLink from "@mui/material/Link";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { routes } from "@/config/navigation";
import { CLERK_PUBLISHABLE_KEY } from "@/lib/auth/ClerkSetup";
import { check, completeUrl, RESEND_WAIT_MS } from "@/lib/auth/clerkFlow";
import { useGoogleSignIn } from "@/lib/auth/useGoogleSignIn";
import { EMAIL_PATTERN } from "@/lib/auth/validation";
import { useRequest } from "@/lib/hooks/useRequest";
import GoogleButton from "../GoogleButton";
import NewPasswordStep from "../NewPasswordStep";
import VerifyCodeStep from "../VerifyCodeStep";
import { styles } from "./LoginForm.styles";

interface LoginFormProps {
  // Where to go once signed in (already checked to be on this site).
  next: string;
}

// signIn: email and password. verify: Clerk asks for an emailed code (new
// device). forgot → resetCode → newPassword: password reset by emailed code.
type View = "signIn" | "verify" | "forgot" | "resetCode" | "newPassword";

export default function LoginForm(props: LoginFormProps) {
  if (!CLERK_PUBLISHABLE_KEY) return <Alert severity="warning">Sign-in is unavailable right now. Please try again later.</Alert>;
  return <ClerkLoginForm {...props} />;
}

function ClerkLoginForm({ next }: LoginFormProps) {
  const { signIn } = useSignIn();
  const startGoogle = useGoogleSignIn();
  const [view, setView] = useState<View>("signIn");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [google, setGoogle] = useState(false);
  const [resendAvailableAt, setResendAvailableAt] = useState(0);
  const { busy, error, setError, run } = useRequest();

  const cleanEmail = email.trim().toLowerCase();
  const errors = {
    email: !cleanEmail ? "Enter your email." : EMAIL_PATTERN.test(cleanEmail) ? "" : "Enter a valid email address.",
    password: view === "signIn" && !password ? "Enter your password." : "",
  };

  // Clerk has a session: our completion page turns it into a QuickHotels24/7 session.
  async function finish() {
    check(
      await signIn.finalize({
        navigate: ({ decorateUrl }) => {
          window.location.assign(decorateUrl(completeUrl(next)));
        },
      }),
    );
  }

  async function continueAfterPassword() {
    if (signIn.status === "complete") return finish();
    if (signIn.status === "needs_second_factor" || signIn.status === "needs_client_trust") {
      await sendSignInCode();
      setView("verify");
      return;
    }
    throw new Error("This account needs a sign-in step we don't support yet. Please contact support.");
  }

  async function sendSignInCode() {
    check(await signIn.mfa.sendEmailCode());
    setResendAvailableAt(Date.now() + RESEND_WAIT_MS);
  }

  async function sendResetCode() {
    check(await signIn.resetPasswordEmailCode.sendCode());
    setResendAvailableAt(Date.now() + RESEND_WAIT_MS);
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
    if (errors.email || errors.password) return;
    if (view === "forgot") {
      void run(async () => {
        check(await signIn.create({ identifier: cleanEmail }));
        await sendResetCode();
        setView("resetCode");
      });
      return;
    }
    void run(async () => {
      check(await signIn.password({ identifier: cleanEmail, password }));
      await continueAfterPassword();
    });
  }

  async function continueWithGoogle() {
    setGoogle(true);
    await run(() => startGoogle(next));
    setGoogle(false);
  }

  function goTo(view: View) {
    void signIn.reset();
    setError("");
    setSubmitted(false);
    setPassword("");
    setView(view);
  }

  if (view === "verify") {
    return (
      <VerifyCodeStep
        email={cleanEmail}
        resendAvailableAt={resendAvailableAt}
        onVerify={async (code) => {
          check(await signIn.mfa.verifyEmailCode({ code }));
          await finish();
        }}
        onResend={sendSignInCode}
        onChangeEmail={() => goTo("signIn")}
      />
    );
  }
  if (view === "resetCode") {
    return (
      <VerifyCodeStep
        email={cleanEmail}
        resendAvailableAt={resendAvailableAt}
        onVerify={async (code) => {
          check(await signIn.resetPasswordEmailCode.verifyCode({ code }));
          setView("newPassword");
        }}
        onResend={sendResetCode}
        onChangeEmail={() => goTo("forgot")}
      />
    );
  }
  if (view === "newPassword") {
    return (
      <NewPasswordStep
        email={cleanEmail}
        submitLabel="Save password and log in"
        onSubmit={async (newPassword) => {
          check(await signIn.resetPasswordEmailCode.submitPassword({ password: newPassword }));
          await continueAfterPassword();
        }}
        onStartOver={() => goTo("forgot")}
      />
    );
  }

  const forgot = view === "forgot";
  return (
    <Box component="form" onSubmit={submit} noValidate sx={styles.root}>
      {!forgot && <GoogleButton onClick={continueWithGoogle} pending={google} disabled={busy} />}
      {forgot && <Typography sx={styles.hint}>Enter your account&apos;s email and we&apos;ll send a code to choose a new password.</Typography>}
      {error && <Alert severity="error">{error}</Alert>}
      <TextField
        label="Email"
        type="email"
        autoComplete="email"
        inputMode="email"
        autoFocus
        fullWidth
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        error={submitted && Boolean(errors.email)}
        helperText={submitted ? errors.email : undefined}
        disabled={busy}
      />
      {!forgot && (
        <Box>
          <TextField
            label="Password"
            type="password"
            autoComplete="current-password"
            fullWidth
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            error={submitted && Boolean(errors.password)}
            helperText={submitted ? errors.password : undefined}
            disabled={busy}
          />
          <Button size="small" onClick={() => goTo("forgot")} sx={styles.forgot}>
            Forgot password?
          </Button>
        </Box>
      )}
      {/* Clerk's bot protection renders here when it needs to. */}
      <div id="clerk-captcha" />
      <Button type="submit" variant="contained" size="large" disabled={busy}>
        {forgot ? (busy ? "Sending code…" : "Send reset code") : busy && !google ? "Logging in…" : "Log in"}
      </Button>
      <Typography sx={styles.switch}>
        {forgot ? (
          <>
            Remembered it?{" "}
            <Button size="small" onClick={() => goTo("signIn")} sx={styles.inline}>
              Back to log in
            </Button>
          </>
        ) : (
          <>
            New to QuickHotels24/7?{" "}
            <MuiLink component={Link} href={`${routes.signup}?${new URLSearchParams({ next })}`} sx={styles.link}>
              Create an account
            </MuiLink>
          </>
        )}
      </Typography>
    </Box>
  );
}
