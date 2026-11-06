"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { AdminAuthResponse, AdminProfile } from "@quickhotels/types/admin";
import { ApiError } from "@/lib/api/client";
import { adminApi } from "@/lib/api/admin";

// The admin's session, kept apart from customer sign-in (its own token key).
const TOKEN_KEY = "quickhotels.adminToken";
const store = {
  get: () => {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },
  set: (token: string) => {
    try {
      localStorage.setItem(TOKEN_KEY, token);
    } catch {
      // Works until the page reloads.
    }
  },
  clear: () => {
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch {
      // Nothing to clear.
    }
  },
};

export type AdminStatus = "loading" | "authenticated" | "anonymous";

interface AdminAuthValue {
  admin: AdminProfile | null;
  token: string | null;
  status: AdminStatus;
  startSession: (response: AdminAuthResponse) => void;
  logout: () => Promise<void>;
}

const AdminAuthContext = createContext<AdminAuthValue | null>(null);

export function useAdminAuth() {
  const value = useContext(AdminAuthContext);
  if (!value) throw new Error("useAdminAuth must be used inside AdminAuthProvider");
  return value;
}

// Restores the admin session on load; signs in and out.
export default function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<AdminProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [status, setStatus] = useState<AdminStatus>("loading");

  useEffect(() => {
    const saved = store.get();
    if (!saved) {
      setStatus("anonymous");
      return;
    }
    const controller = new AbortController();
    adminApi
      .me(saved, controller.signal)
      .then((profile) => {
        setAdmin(profile);
        setToken(saved);
        setStatus("authenticated");
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        if (error instanceof ApiError && error.status === 401) store.clear();
        setStatus("anonymous");
      });
    return () => controller.abort();
  }, []);

  const startSession = useCallback((response: AdminAuthResponse) => {
    store.set(response.token);
    setToken(response.token);
    setAdmin(response.admin);
    setStatus("authenticated");
  }, []);

  const value = useMemo<AdminAuthValue>(
    () => ({
      admin,
      token,
      status,
      startSession,
      logout: async () => {
        const current = store.get();
        store.clear();
        setAdmin(null);
        setToken(null);
        setStatus("anonymous");
        if (current) await adminApi.logout(current).catch(() => undefined);
      },
    }),
    [admin, token, status, startSession],
  );

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
}
