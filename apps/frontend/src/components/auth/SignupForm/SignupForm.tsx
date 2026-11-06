"use client";

import { useState } from "react";
import { useSignUp } from "@clerk/react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import type { SignupDetails } from "@quickhotels/types/users";
import { authApi } from "@/lib/api/auth";
import { CLERK_PUBLISHABLE_KEY } from "@/lib/auth/ClerkSetup";
import { check, completeUrl, RESEND_WAIT_MS } from "@/lib/auth/clerkFlow";
import { trimDetails } from "@/lib/auth/validation";
import NewPasswordStep from "../NewPasswordStep";
import VerifyCodeStep from "../VerifyCodeStep";
import DetailsStep from "./DetailsStep";
import StepIndicator from "./StepIndicator";
import { styles } from "./SignupForm.styles";

interface SignupFormProps {
  // Where to go once the account exists (already checked to be on this site).
  next: string;
}

const STEPS = ["details", "password", "verify"] as const;
type Step = (typeof STEPS)[number];

export default function SignupForm(props: SignupFormProps) {
  if (!CLERK_PUBLISHABLE_KEY) return <Alert severity="warning">Registration is unavailable right now. Please try again later.</Alert>;
  return <ClerkSignupForm {...props} />;
}

// Details (checked by our backend) → password → emailed code, all through
// Clerk; the completion page then creates our verified account.
function ClerkSignupForm({ next }: SignupFormProps) {
  const { signUp } = useSignUp();
  const [step, setStep] = useState<Step>("details");
  const [details, setDetails] = useState<SignupDetails>({ firstName: "", lastName: "", email: "", username: "" });
  const [resendAvailableAt, setResendAvailableAt] = useState(0);
  const clean = trimDetails(details);

  async function sendCode() {
    check(await signUp.verifications.sendEmailCode());
    setResendAvailableAt(Date.now() + RESEND_WAIT_MS);
    setStep("verify");
  }

  async function choosePassword(password: string) {
    check(
      await signUp.password({
        emailAddress: clean.email,
        password,
        firstName: clean.firstName,
        lastName: clean.lastName,
        // The backend gives the new account this username.
        unsafeMetadata: { quickhotelsUsername: clean.username.toLowerCase() },
      }),
    );
    await sendCode();
  }

  async function verifyCode(code: string) {
    // A finished Clerk account can retry the handoff without verifying twice.
    if (signUp.status !== "complete") check(await signUp.verifications.verifyEmailCode({ code }));
    if (signUp.status !== "complete") throw new Error("Your account needs another verification step. Please log in to continue.");
    check(
      await signUp.finalize({
        navigate: ({ decorateUrl }) => {
          window.location.assign(decorateUrl(completeUrl(next)));
        },
      }),
    );
  }

  function startOver() {
    void signUp.reset();
    setStep("details");
  }

  return (
    <Box sx={styles.root}>
      <StepIndicator current={STEPS.indexOf(step)} />
      {/* Clerk's bot protection renders here when it needs to. */}
      <div id="clerk-captcha" />
      {step === "details" && (
        <DetailsStep
          values={details}
          next={next}
          onChange={setDetails}
          onContinue={async () => {
            await authApi.checkSignupDetails(clean);
            setStep("password");
          }}
        />
      )}
      {step === "password" && <NewPasswordStep email={clean.email} submitLabel="Create account" onSubmit={choosePassword} onStartOver={startOver} />}
      {step === "verify" && (
        <VerifyCodeStep email={clean.email} resendAvailableAt={resendAvailableAt} onVerify={verifyCode} onResend={sendCode} onChangeEmail={startOver} />
      )}
    </Box>
  );
}
