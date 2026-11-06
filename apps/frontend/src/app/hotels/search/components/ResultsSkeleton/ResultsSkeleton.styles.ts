export const styles = {
  root: { display: "flex", flexDirection: "column", gap: 2 },
  message: { fontSize: "0.9rem", fontWeight: 600, color: "primary.main" },
  card: {
    display: "grid",
    gridTemplateColumns: { xs: "112px minmax(0, 1fr)", sm: "200px minmax(0, 1fr)", md: "220px minmax(0, 1fr) 200px" },
    gap: 2,
    p: 1.5,
    borderRadius: 3,
    border: 1,
    borderColor: "divider",
    bgcolor: "background.paper",
  },
  media: { width: "100%", height: { xs: 120, sm: 180 }, borderRadius: 2 },
  body: { display: "flex", flexDirection: "column", gap: 0.5 },
  last: { mt: "auto" },
  pricing: { display: { xs: "none", md: "flex" }, flexDirection: "column", alignItems: "flex-end", justifyContent: "flex-end", gap: 0.5 },
};
