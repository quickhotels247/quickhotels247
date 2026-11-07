export const styles = {
  card: { width: "100%", borderRadius: 3 },
  action: { display: "flex", alignItems: "center", justifyContent: "flex-start", gap: 1.5, p: 1.75, height: "100%" },
  icon: {
    flexShrink: 0,
    width: 40,
    height: 40,
    borderRadius: 2,
    display: "grid",
    placeItems: "center",
    bgcolor: "primary.light",
    color: "primary.main",
  },
  body: { minWidth: 0 },
  destination: { fontWeight: 700, fontSize: "1rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  details: { fontSize: "0.8125rem", color: "text.secondary" },
};
