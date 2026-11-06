export const styles = {
  root: { display: "flex", gap: 1, overflowX: "auto", pb: 0.5 },
  step: { display: "flex", alignItems: "center", gap: 1.25, px: 2, py: 1.25, borderRadius: 2.5, border: 1, borderColor: "divider", bgcolor: "background.paper", flexShrink: 0, textAlign: "left" },
  active: { borderColor: "primary.main", boxShadow: "0 0 0 2px rgba(26, 86, 219, 0.2)" },
  number: { width: 28, height: 28, borderRadius: "50%", display: "grid", placeItems: "center", bgcolor: "rgba(26, 86, 219, 0.1)", color: "primary.main", fontWeight: 800, fontSize: "0.85rem" },
  done: { bgcolor: "transparent", color: "success.main" },
  text: { minWidth: 0 },
  label: { fontWeight: 700, fontSize: "0.9rem", whiteSpace: "nowrap" },
  meta: { fontSize: "0.75rem", color: "text.secondary" },
};
