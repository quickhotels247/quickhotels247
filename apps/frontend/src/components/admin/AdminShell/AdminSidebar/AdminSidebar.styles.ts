export const styles = {
  root: { width: 260, height: "100%", bgcolor: "background.paper", borderRight: 1, borderColor: "divider", display: "flex", flexDirection: "column", overflowY: "auto" },
  brand: { display: "flex", alignItems: "center", gap: 1, px: 2.5, py: 2 },
  badge: { fontSize: "0.7rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: 0.5, color: "primary.main", bgcolor: "rgba(26, 86, 219, 0.08)", px: 0.75, py: 0.25, borderRadius: 1 },
  section: { px: 1.5, py: 1 },
  sectionTitle: { px: 1, pb: 0.5, fontSize: "0.7rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: 0.6, color: "text.secondary" },
  item: { borderRadius: 2, mb: 0.25, "&.Mui-selected": { bgcolor: "rgba(26, 86, 219, 0.1)", color: "primary.main", "& .MuiListItemIcon-root": { color: "primary.main" } } },
  icon: { minWidth: 34 },
  soon: { height: 18, fontSize: "0.65rem" },
};
