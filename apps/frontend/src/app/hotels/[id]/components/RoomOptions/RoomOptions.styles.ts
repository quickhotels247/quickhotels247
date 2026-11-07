export const styles = {
  list: { display: "flex", flexDirection: "column", gap: 2, transition: "opacity 0.2s" },
  refreshing: { opacity: 0.55, pointerEvents: "none" },
  loading: { fontSize: "0.9375rem", fontWeight: 600, color: "primary.main" },
  skeleton: { borderRadius: 3 },
  empty: { textAlign: "center", py: 5, px: 3, bgcolor: "background.paper", border: 1, borderColor: "divider", borderRadius: 3 },
  emptyIcon: { fontSize: 40, color: "text.secondary", mb: 1 },
  emptyTitle: { fontSize: "1.125rem", fontWeight: 700, mb: 0.5 },
  emptyText: { fontSize: "0.9375rem", color: "text.secondary", mb: 2 },
  footnote: { fontSize: "0.8125rem", color: "text.secondary" },
};
