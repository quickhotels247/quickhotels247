export const styles = {
  root: {
    display: "flex",
    flexDirection: { xs: "column", sm: "row" },
    alignItems: { xs: "stretch", sm: "center" },
    justifyContent: "space-between",
    gap: 1.5,
    mb: 2,
  },
  title: { fontSize: { xs: "1.2rem", md: "1.45rem" }, fontWeight: 800, lineHeight: 1.3 },
  controls: { display: "flex", gap: 1, flexShrink: 0 },
  filtersButton: { display: { xs: "flex", md: "none" }, flex: { xs: 1, sm: "none" } },
  sort: { flex: { xs: 1, sm: "none" }, minWidth: { sm: 220 }, "& .MuiInputBase-root": { borderRadius: 2, bgcolor: "background.paper" } },
};
