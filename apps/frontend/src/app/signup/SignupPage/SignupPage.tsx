"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Container from "@mui/material/Container";
import AuthCard from "@/components/auth/AuthCard";
import SignupForm from "@/components/auth/SignupForm";
import { safeNext } from "@/lib/auth/safeNext";
import { useAuth } from "@/lib/auth/useAuth";
import { styles } from "./SignupPage.styles";

// Create an account (spec §4.10). Signed-in visitors go straight on to ?next.
export default function SignupPage() {
  const params = useSearchParams();
  const router = useRouter();
  const { status } = useAuth();
  const next = safeNext(params.get("next"));

  useEffect(() => {
    if (status === "authenticated") router.replace(next);
  }, [status, next, router]);

  return (
    <Container disableGutters sx={styles.root}>
      <AuthCard title="Create your account" subtitle="Book faster and keep all your trips in one place.">
        <SignupForm next={next} />
      </AuthCard>
    </Container>
  );
}
