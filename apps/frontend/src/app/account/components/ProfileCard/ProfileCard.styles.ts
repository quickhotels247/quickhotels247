export const styles = {
  root: { bgcolor: "background.paper", border: 1, borderColor: "divider", borderRadius: 3, p: { xs: 2.5, md: 3 } },
  head: { display: "flex", alignItems: "center", gap: 2, mb: 2.5 },
  avatar: { width: 56, height: 56, fontSize: "1.4rem", fontWeight: 700, bgcolor: "primary.main" },
  name: { fontSize: "1.2rem", fontWeight: 800 },
  since: { fontSize: "0.875rem", color: "text.secondary" },
  list: { m: 0, display: "flex", flexDirection: "column", gap: 1.5 },
  row: { display: "grid", gridTemplateColumns: { xs: "1fr", sm: "160px 1fr" }, gap: { xs: 0.25, sm: 2 } },
  label: { fontSize: "0.875rem", color: "text.secondary" },
  value: { m: 0, fontSize: "0.9375rem", fontWeight: 600, minWidth: 0, overflowWrap: "anywhere" },
  email: { display: "inline-flex", alignItems: "center", gap: 1, flexWrap: "wrap" },
  chip: { height: 22, fontSize: "0.75rem" },
};
