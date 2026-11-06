export const styles = {
  root: {
    display: "flex", alignItems: "flex-start", gap: 2, p: 2.5, color: "inherit", textDecoration: "none",
    bgcolor: "background.paper", border: 1, borderColor: "divider", borderRadius: 3, transition: "border-color 0.15s, box-shadow 0.15s",
    "&:hover, &:focus-visible": { borderColor: "primary.main", boxShadow: 2 },
  },
  icon: { width: 44, height: 44, borderRadius: 2, display: "grid", placeItems: "center", bgcolor: "rgba(26, 86, 219, 0.1)", color: "primary.main", flexShrink: 0 },
  text: { flex: 1, minWidth: 0 },
  title: { fontWeight: 800, fontSize: "1rem" },
  description: { fontSize: "0.85rem", color: "text.secondary", mt: 0.25 },
  status: { fontSize: "0.8rem", fontWeight: 700, color: "primary.main", mt: 0.75 },
  chevron: { color: "text.disabled", alignSelf: "center" },
};
