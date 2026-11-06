export const styles = {
  root: { py: { xs: 3, md: 5 }, display: "flex", flexDirection: "column", gap: 2 },
  title: { fontSize: { xs: "1.5rem", md: "1.9rem" }, fontWeight: 800 },
  head: { display: "flex", alignItems: { sm: "center" }, justifyContent: "space-between", gap: 2, flexDirection: { xs: "column", sm: "row" } },
  subtitle: { color: "text.secondary" },
  add: { flexShrink: 0, alignSelf: { xs: "flex-start", sm: "auto" } },
  skeleton: { borderRadius: 3 },
  empty: { textAlign: "center", py: 6, px: 2, bgcolor: "background.paper", border: 1, borderColor: "divider", borderStyle: "dashed", borderRadius: 3 },
  emptyIcon: { fontSize: 44, color: "text.disabled", mb: 1 },
  emptyTitle: { fontWeight: 700, mb: 0.5 },
  removeError: { mb: 2 },
  actions: { px: 3, pb: 2 },
};
