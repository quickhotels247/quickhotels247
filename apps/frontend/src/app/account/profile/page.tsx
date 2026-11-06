import type { Metadata } from "next";
import ProfilePage from "./ProfilePage";

export const metadata: Metadata = { title: "Personal details", robots: { index: false } };

export default function Page() {
  return <ProfilePage />;
}
