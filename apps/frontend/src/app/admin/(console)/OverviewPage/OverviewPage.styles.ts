export const styles = {
  stats: { display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(3, minmax(0, 1fr))" }, gap: 2, mb: 3 },
  skeleton: { borderRadius: 3 },
  card: { bgcolor: "background.paper", border: 1, borderColor: "divider", borderRadius: 3, p: { xs: 2, md: 3 } },
  cardTitle: { fontSize: "1.125rem", fontWeight: 800, mb: 1.5 },
  empty: { color: "text.secondary", fontSize: "0.9375rem" },
  list: { listStyle: "none", m: 0, p: 0 },
  row: { display: "flex", justifyContent: "space-between", gap: 2, py: 1.25, "& + &": { borderTop: 1, borderColor: "divider" } },
  action: { fontWeight: 700, fontSize: "0.9375rem" },
  meta: { fontSize: "0.8125rem", color: "text.secondary" },
  time: { fontSize: "0.8125rem", color: "text.secondary", whiteSpace: "nowrap" },
};
