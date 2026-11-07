import type { Metadata } from "next";
import TicketPage from "../TicketPage";

export const metadata: Metadata = { title: "Support request" };

export default function Page() {
  return <TicketPage />;
}
