"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import type { AuthResponse, User } from "@quickhotels/types/users";
import { ApiError } from "@/lib/api/client";
import { authApi } from "@/lib/api/auth";
import { AuthContext, type AuthStatus } from "./authContext";
import { tokenStore } from "./tokenStore";

// Holds the customer's session: restores it on load, starts it after a
// Clerk sign-in, and ends it on logout.
export default function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  // "loading" until the browser has checked for a saved session.
  const [status, setStatus] = useState<AuthStatus>("loading");

  useEffect(() => {
    const saved = tokenStore.get();
    if (!saved) {
      setStatus("anonymous");
      return;
    }
    const controller = new AbortController();
    authApi
      .me(saved, controller.signal)
      .then((current) => {
        setUser(current);
        setToken(saved);
        setStatus("authenticated");
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        // Expired or revoked: forget it. Other errors keep it for next time.
        if (error instanceof ApiError && error.status === 401) tokenStore.clear();
        setStatus("anonymous");
      });
    return () => controller.abort();
  }, []);

  const startSession = useCallback((response: AuthResponse) => {
    tokenStore.set(response.token);
    setToken(response.token);
    setUser(response.user);
    setStatus("authenticated");
    return response.user;
  }, []);

  const value = useMemo(
    () => ({
      user,
      status,
      token,
      loginWithClerk: async (clerkToken: string) => startSession(await authApi.loginWithClerk(clerkToken)),
      logout: async () => {
        const current = tokenStore.get();
        tokenStore.clear();
        setUser(null);
        setToken(null);
        setStatus("anonymous");
        // Signed out here either way; the call only revokes the token.
        if (current) await authApi.logout(current).catch(() => undefined);
      },
      updateUser: setUser,
    }),
    [user, status, token, startSession],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
