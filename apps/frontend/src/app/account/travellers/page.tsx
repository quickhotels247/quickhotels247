import type { Metadata } from "next";
import SavedTravellersPage from "./SavedTravellersPage";

export const metadata: Metadata = { title: "Saved travellers", robots: { index: false } };

export default function Page() {
  return <SavedTravellersPage />;
}
