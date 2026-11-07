export const styles = {
  root: { display: "flex", alignItems: "center", gap: 2, py: 1.5, flexWrap: { xs: "wrap", sm: "nowrap" }, "& + &": { borderTop: 1, borderColor: "divider" } },
  muted: { opacity: 0.65 },
  code: { fontFamily: "ui-monospace, Menlo, monospace", fontWeight: 700, fontSize: "0.9375rem", bgcolor: "primary.light", color: "primary.main", borderRadius: 1.5, px: 1.25, py: 0.5, flexShrink: 0 },
  main: { flex: 1, minWidth: 200 },
  title: { fontWeight: 700, display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" },
  chip: { height: 20, fontSize: "0.75rem" },
  meta: { fontSize: "0.8125rem", color: "text.secondary", mt: 0.25 },
  actions: { display: "flex", flexShrink: 0 },
};
