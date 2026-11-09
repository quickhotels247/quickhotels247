import { HEADING_FONT } from "@/theme/theme";

export const styles = {
  root: { display: "grid", gridTemplateColumns: { xs: "48px minmax(0, 1fr)", sm: "64px minmax(0, 1fr)" }, gap: 2, p: 2, borderRadius: 3, border: 1, borderColor: "divider", boxShadow: "none" },
  icon: { width: { xs: 48, sm: 64 }, height: { xs: 48, sm: 64 }, borderRadius: 2, bgcolor: "primary.light", color: "primary.main", display: "grid", placeItems: "center" },
  body: { display: "flex", flexDirection: "column", gap: 0.5, minWidth: 0 },
  top: { display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 1, flexWrap: "wrap" },
  route: { fontWeight: 800, fontSize: "1.125rem" },
  chip: { height: 22, fontSize: "0.75rem", fontWeight: 600 },
  meta: { fontSize: "0.875rem", color: "text.secondary" },
  bottom: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1, mt: "auto", pt: 1 },
  total: { fontFamily: HEADING_FONT, fontWeight: 800, fontSize: "1.125rem" },
};
