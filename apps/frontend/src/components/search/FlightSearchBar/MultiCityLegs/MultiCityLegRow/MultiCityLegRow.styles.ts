export const styles = {
  root: { display: "flex", flexDirection: "column", gap: 0.5 },
  number: { px: 0.5, fontSize: "0.78rem", fontWeight: 700, color: "text.secondary" },
  fields: {
    display: "grid",
    gap: { xs: 1, md: 0 },
    gridTemplateColumns: { xs: "1fr", md: "minmax(0, 1.2fr) auto minmax(0, 1.2fr) minmax(0, 1fr) 44px" },
    alignItems: "stretch",
    border: { md: "1px solid" },
    borderColor: { md: "divider" },
    borderRadius: { md: 2 },
  },
  removeCell: { display: "flex", alignItems: "center", justifyContent: { xs: "flex-end", md: "center" } },
  remove: { color: "text.secondary" },
};
