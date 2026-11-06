import { createContext } from "react";
import type { User } from "@quickhotels/types/users";

export type AuthStatus = "loading" | "authenticated" | "anonymous";

export interface AuthContextValue {
  user: User | null;
  status: AuthStatus;
  // The session token for calls that need a signed-in customer.
  token: string | null;
  // Exchanges a Clerk session token for our session.
  loginWithClerk: (clerkToken: string) => Promise<User>;
  logout: () => Promise<void>;
  // Replaces the signed-in user after a profile edit.
  updateUser: (user: User) => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
