export const styles = {
  root: { display: "grid", gridTemplateColumns: { xs: "1fr", md: "minmax(0, 2fr) minmax(0, 1fr)" }, gap: 2, alignItems: "start" },
  map: { width: "100%", height: { xs: 240, md: 320 }, border: 0, borderRadius: 3, bgcolor: "action.hover" },
  side: { display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 1.5 },
  address: { fontSize: "0.92rem", color: "text.secondary", lineHeight: 1.6 },
};
