"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Container from "@mui/material/Container";
import AuthCard from "@/components/auth/AuthCard";
import LoginForm from "@/components/auth/LoginForm";
import { safeNext } from "@/lib/auth/safeNext";
import { useAuth } from "@/lib/auth/useAuth";
import { styles } from "./LoginPage.styles";

// Log in (spec §4.10). Signed-in visitors go straight on to ?next.
export default function LoginPage() {
  const params = useSearchParams();
  const router = useRouter();
  const { status } = useAuth();
  const next = safeNext(params.get("next"));

  useEffect(() => {
    if (status === "authenticated") router.replace(next);
  }, [status, next, router]);

  return (
    <Container disableGutters sx={styles.root}>
      <AuthCard title="Welcome back" subtitle="Log in to manage your stays and check out faster.">
        <LoginForm next={next} />
      </AuthCard>
    </Container>
  );
}
