export const styles = {
  root: { py: { xs: 3, md: 5 }, display: "flex", flexDirection: "column", gap: 2 },
  title: { fontSize: { xs: "1.5rem", md: "1.9rem" }, fontWeight: 800 },
  subtitle: { color: "text.secondary" },
  grid: { display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))", md: "repeat(3, minmax(0, 1fr))" }, gap: 2 },
  skeleton: { borderRadius: 3 },
  empty: { textAlign: "center", py: 6, px: 2, bgcolor: "background.paper", border: 1, borderColor: "divider", borderStyle: "dashed", borderRadius: 3 },
  emptyIcon: { fontSize: 44, color: "text.disabled", mb: 1 },
  emptyTitle: { fontWeight: 700, mb: 0.5 },
  emptyButton: { mt: 2 },
};
