import type { Metadata } from "next";
import TeamPage from "./TeamPage";

export const metadata: Metadata = { title: "Admin team" };

export default function Page() {
  return <TeamPage />;
}
