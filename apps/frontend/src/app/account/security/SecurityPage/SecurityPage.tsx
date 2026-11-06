"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Alert from "@mui/material/Alert";
import Skeleton from "@mui/material/Skeleton";
import type { AccountSecurity } from "@quickhotels/types/users";
import { accountApi } from "@/lib/api/auth";
import { useAuth } from "@/lib/auth/useAuth";
import AccountShell from "../../components/AccountShell";
import DeleteAccountCard from "../../components/DeleteAccountCard";
import DevicesCard from "../../components/DevicesCard";
import SignInMethodsCard from "../../components/SignInMethodsCard";
import { styles } from "./SecurityPage.styles";

// Sign-in methods (password, Google), signed-in devices, deleting the account.
export default function SecurityPage() {
  const { user, token } = useAuth();
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [security, setSecurity] = useState<AccountSecurity | null>(null);
  const [error, setError] = useState("");
  // Back from connecting Google (?connected=google): say so once.
  const [connected] = useState(() => params.get("connected") === "google");

  useEffect(() => {
    if (params.has("connected")) router.replace(pathname, { scroll: false });
  }, [params, pathname, router]);

  useEffect(() => {
    if (!token) return;
    const controller = new AbortController();
    accountApi
      .security(token, controller.signal)
      .then(setSecurity)
      .catch((caught: Error) => !controller.signal.aborted && setError(caught.message));
    return () => controller.abort();
  }, [token]);

  return (
    <AccountShell title="Security" subtitle="How you sign in, and where you're signed in.">
      {user && token && (
        <>
          {connected && <Alert severity="success">Google is now connected to your account.</Alert>}
          {error && <Alert severity="error">{error}</Alert>}
          {!security && !error && <Skeleton variant="rounded" height={180} sx={styles.skeleton} />}
          {security && <SignInMethodsCard security={security} token={token} accountEmail={user.email} onChange={setSecurity} />}
          <DevicesCard token={token} />
          <DeleteAccountCard token={token} email={user.email} />
        </>
      )}
    </AccountShell>
  );
}
