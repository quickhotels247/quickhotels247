import type { Metadata } from "next";
import PreferencesPage from "./PreferencesPage";

export const metadata: Metadata = { title: "Email preferences", robots: { index: false } };

export default function Page() {
  return <PreferencesPage />;
}
