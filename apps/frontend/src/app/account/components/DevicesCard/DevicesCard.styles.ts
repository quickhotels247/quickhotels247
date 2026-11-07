export const styles = {
  root: { bgcolor: "background.paper", border: 1, borderColor: "divider", borderRadius: 3, p: { xs: 2.5, md: 3 }, display: "flex", flexDirection: "column", gap: 1.5 },
  head: { display: "flex", justifyContent: "space-between", alignItems: { sm: "center" }, gap: 1.5, flexDirection: { xs: "column", sm: "row" } },
  title: { fontSize: "1.125rem", fontWeight: 800 },
  subtitle: { fontSize: "0.875rem", color: "text.secondary" },
  all: { flexShrink: 0, alignSelf: { xs: "flex-start", sm: "auto" } },
  row: { display: "flex", alignItems: "center", gap: 1.5, py: 1, borderTop: 1, borderColor: "divider" },
  icon: { color: "text.secondary" },
  text: { flex: 1, minWidth: 0 },
  device: { fontWeight: 700, fontSize: "0.9375rem", display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" },
  chip: { height: 20, fontSize: "0.75rem" },
  meta: { fontSize: "0.8125rem", color: "text.secondary" },
};
