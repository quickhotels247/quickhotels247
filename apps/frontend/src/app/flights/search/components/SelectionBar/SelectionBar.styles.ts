import { HEADING_FONT } from "@/theme/theme";

export const styles = {
  root: {
    position: "sticky",
    bottom: { xs: 56, md: 0 },
    zIndex: 5,
    bgcolor: "background.paper",
    borderTop: 1,
    borderColor: "divider",
    boxShadow: "0 -8px 24px -16px rgba(15,23,42,0.35)",
    mt: 3,
  },
  inner: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2, py: 1.5, flexWrap: { xs: "wrap", md: "nowrap" } },
  picks: { display: "flex", gap: 3, minWidth: 0, flexWrap: "wrap" },
  pick: { minWidth: 0 },
  pickLabel: { fontSize: "0.75rem", color: "text.secondary", fontWeight: 700, textTransform: "uppercase" },
  pickValue: { fontSize: "0.875rem", fontWeight: 600 },
  action: { display: "flex", alignItems: "center", gap: 2, ml: "auto" },
  totalBox: { textAlign: "right" },
  totalLabel: { fontSize: "0.75rem", color: "text.secondary" },
  total: { fontFamily: HEADING_FONT, fontSize: "1.25rem", fontWeight: 800 },
};
