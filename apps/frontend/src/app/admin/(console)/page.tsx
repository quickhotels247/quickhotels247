import { Suspense } from "react";
import type { Metadata } from "next";
import OverviewPage from "./OverviewPage";

export const metadata: Metadata = { title: "Overview" };

export default function Page() {
  return (
    <Suspense>
      <OverviewPage />
    </Suspense>
  );
}
