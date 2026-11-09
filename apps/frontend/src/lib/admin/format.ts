import { formatPrice } from "@/lib/format";

export const money = (value: { amount: number; currency: string } | null | undefined) => (value ? formatPrice(value) : "—");
export const when = (iso: string | null | undefined) =>
  iso ? new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" }) : "—";
// "2026-11-25T05:45" (airport local time) → "25 Nov, 05:45".
export const flightTime = (local: string | null | undefined) => {
  if (!local) return "—";
  const [day = "", time = ""] = local.split("T");
  return `${new Date(`${day}T00:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}, ${time.slice(0, 5)}`;
};
