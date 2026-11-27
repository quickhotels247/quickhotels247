import { HEADING_FONT } from "@/theme/theme";

export const styles = {
  root: { m: 0, display: "flex", flexDirection: "column", gap: 0.75 },
  row: { display: "flex", justifyContent: "space-between", gap: 2 },
  label: { fontSize: "0.875rem", color: "text.secondary" },
  value: { m: 0, fontSize: "0.875rem", fontWeight: 600, fontVariantNumeric: "tabular-nums" },
  discount: { color: "success.dark" },
  sub: { pl: 1.5 },
  subLabel: { fontSize: "0.8125rem", color: "text.secondary" },
  subValue: { m: 0, fontSize: "0.8125rem", color: "text.secondary", fontVariantNumeric: "tabular-nums" },
  divider: { my: 0.75 },
  totalLabel: { fontWeight: 800 },
  total: { fontFamily: HEADING_FONT, m: 0, fontSize: "1.25rem", fontWeight: 800, fontVariantNumeric: "tabular-nums" },
  note: { fontSize: "0.75rem", color: "text.secondary" },
};
