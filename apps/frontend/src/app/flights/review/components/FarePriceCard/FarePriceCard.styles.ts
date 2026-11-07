import { HEADING_FONT } from "@/theme/theme";

export const styles = {
  root: { bgcolor: "background.paper", border: 1, borderColor: "divider", borderRadius: 3, p: { xs: 2, md: 3 }, display: "flex", flexDirection: "column", gap: 1.5 },
  heading: { fontSize: "1.125rem", fontWeight: 800 },
  list: { m: 0, display: "flex", flexDirection: "column", gap: 0.75 },
  row: { display: "flex", justifyContent: "space-between", gap: 2 },
  label: { fontSize: "0.875rem", color: "text.secondary" },
  value: { m: 0, fontSize: "0.875rem", fontWeight: 600, fontVariantNumeric: "tabular-nums" },
  divider: { my: 0.5 },
  totalLabel: { fontWeight: 800 },
  total: { fontFamily: HEADING_FONT, m: 0, fontSize: "1.3rem", fontWeight: 800 },
  note: { fontSize: "0.75rem", color: "text.secondary" },
};
