export const styles = {
  root: { bgcolor: "background.paper", border: 1, borderColor: "divider", borderRadius: 3, p: { xs: 2, md: 3 } },
  times: { display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2, pb: 2, mb: 2, borderBottom: 1, borderColor: "divider" },
  time: { display: "flex", gap: 1.5, alignItems: "flex-start" },
  icon: { color: "primary.main", mt: "2px" },
  label: { fontSize: "0.8125rem", color: "text.secondary" },
  value: { fontWeight: 700 },
  section: { mb: 2 },
  sectionTitle: { fontSize: "0.9375rem", fontWeight: 700, mb: 0.5 },
  paragraph: { fontSize: "0.875rem", color: "text.secondary", lineHeight: 1.65, mb: 0.5 },
  note: { fontSize: "0.8125rem", color: "text.secondary", mt: 0.5 },
};
