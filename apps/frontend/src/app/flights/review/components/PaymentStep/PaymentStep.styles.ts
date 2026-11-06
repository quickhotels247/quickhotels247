export const styles = {
  root: { display: "flex", flexDirection: "column", gap: 2 },
  card: { bgcolor: "background.paper", border: 1, borderColor: "divider", borderRadius: 3, p: { xs: 2, md: 3 }, display: "flex", flexDirection: "column", gap: 1.25 },
  header: { display: "flex", alignItems: "center", justifyContent: "space-between" },
  title: { fontSize: "1.1rem", fontWeight: 800 },
  list: { m: 0, pl: 2.5, fontSize: "0.92rem", display: "flex", flexDirection: "column", gap: 0.25 },
  type: { color: "text.secondary", textTransform: "capitalize" },
  line: { fontSize: "0.88rem", color: "text.secondary" },
  alert: { borderRadius: 2 },
  note: { fontSize: "0.78rem", color: "text.secondary" },
};
