import { Suspense } from "react";
import type { Metadata } from "next";
import SupportInboxPage from "./SupportInboxPage";

export const metadata: Metadata = { title: "Support" };

export default function Page() {
  return (
    <Suspense>
      <SupportInboxPage />
    </Suspense>
  );
}
