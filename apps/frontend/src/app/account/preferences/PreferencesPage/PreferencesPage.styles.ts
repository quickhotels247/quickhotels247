export const styles = {
  card: { bgcolor: "background.paper", border: 1, borderColor: "divider", borderRadius: 3, px: { xs: 2.5, md: 3 }, py: 1 },
  row: { display: "flex", alignItems: "center", gap: 2, py: 2, "& + &": { borderTop: 1, borderColor: "divider" } },
  text: { flex: 1, minWidth: 0 },
  title: { fontWeight: 700 },
  description: { fontSize: "0.875rem", color: "text.secondary" },
  note: { fontSize: "0.875rem", color: "text.secondary" },
};
