import type { Metadata } from "next";
import SavedHotelsPage from "./SavedHotelsPage";

export const metadata: Metadata = { title: "Saved hotels", robots: { index: false } };

export default function Page() {
  return <SavedHotelsPage />;
}
