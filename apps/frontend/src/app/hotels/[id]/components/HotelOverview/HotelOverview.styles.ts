export const styles = {
  root: { display: "grid", gridTemplateColumns: { xs: "1fr", md: "minmax(0, 1.6fr) minmax(0, 1fr)" }, gap: { xs: 3, md: 5 } },
  headline: { fontSize: "1.125rem", fontWeight: 700, mb: 1.5 },
  section: { mb: 2 },
  sectionTitle: { fontSize: "0.9375rem", fontWeight: 700, mb: 0.75 },
  paragraph: { fontSize: "0.9375rem", color: "text.secondary", lineHeight: 1.7, mb: 1 },
  more: { px: 0, minWidth: 0 },
  highlights: { bgcolor: "background.paper", border: 1, borderColor: "divider", borderRadius: 3, p: 2.5, alignSelf: "start" },
  list: { listStyle: "none", m: 0, p: 0, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1.5 },
  item: { display: "flex", alignItems: "center", gap: 1, fontSize: "0.875rem" },
  icon: { color: "success.main", fontSize: 20 },
};
