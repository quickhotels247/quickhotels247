export const styles = {
  root: { display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", bgcolor: "background.paper", border: 1, borderColor: "divider", borderRadius: 3, overflow: "hidden" },
  tab: {
    flexDirection: "column",
    alignItems: "flex-start",
    px: { xs: 1.5, sm: 2 },
    py: 1.25,
    borderBottom: 3,
    borderColor: "transparent",
    textAlign: "left",
    "& + &": { borderLeft: 1, borderLeftColor: "divider" },
  },
  active: { borderBottomColor: "primary.main", bgcolor: "rgba(26, 86, 219, 0.05)" },
  label: { fontWeight: 800, fontSize: "0.92rem" },
  detail: { fontSize: "0.75rem", color: "text.secondary", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "100%" },
};
