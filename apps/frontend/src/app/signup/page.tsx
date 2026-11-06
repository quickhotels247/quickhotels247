import { Suspense } from "react";
import type { Metadata } from "next";
import SignupPage from "./SignupPage";

export const metadata: Metadata = { title: "Create an account" };

export default function Page() {
  return (
    <Suspense>
      <SignupPage />
    </Suspense>
  );
}
