import { HEADING_FONT } from "@/theme/theme";

export const styles = {
  root: { display: "grid", gridTemplateColumns: { xs: "100px minmax(0, 1fr)", sm: "180px minmax(0, 1fr)" }, gap: 2, p: 1.5, borderRadius: 3, border: 1, borderColor: "divider", boxShadow: "none" },
  photo: { position: "relative", borderRadius: 2, overflow: "hidden", minHeight: { xs: 100, sm: 130 } },
  body: { display: "flex", flexDirection: "column", gap: 0.5, minWidth: 0 },
  top: { display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 1, flexWrap: "wrap" },
  name: { fontWeight: 800, fontSize: "1.125rem" },
  meta: { fontSize: "0.875rem", color: "text.secondary" },
  bottom: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1, mt: "auto", pt: 1 },
  total: { fontFamily: HEADING_FONT, fontWeight: 800, fontSize: "1.125rem" },
};
