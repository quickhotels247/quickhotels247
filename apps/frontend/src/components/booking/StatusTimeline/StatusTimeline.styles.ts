export const styles = {
  root: { bgcolor: "background.paper", border: 1, borderColor: "divider", borderRadius: 3, p: { xs: 2, md: 3 } },
  title: { fontSize: "1rem", fontWeight: 800, mb: 1.5 },
  list: { listStyle: "none", m: 0, p: 0, display: "flex", flexDirection: "column", gap: 1.5, position: "relative" },
  item: { display: "flex", gap: 1.5, alignItems: "flex-start" },
  dot: { width: 12, height: 12, borderRadius: "50%", bgcolor: "divider", mt: 0.6, flexShrink: 0 },
  dotCurrent: { bgcolor: "primary.main", boxShadow: "0 0 0 4px rgba(26, 86, 219, 0.18)" },
  status: { fontWeight: 700, fontSize: "0.9rem" },
  time: { fontSize: "0.78rem", color: "text.secondary" },
};
