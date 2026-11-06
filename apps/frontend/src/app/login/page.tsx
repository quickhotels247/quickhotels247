import { Suspense } from "react";
import type { Metadata } from "next";
import LoginPage from "./LoginPage";

export const metadata: Metadata = { title: "Log in" };

export default function Page() {
  return (
    <Suspense>
      <LoginPage />
    </Suspense>
  );
}
