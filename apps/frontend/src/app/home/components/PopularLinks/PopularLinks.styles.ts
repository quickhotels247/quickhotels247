export const styles = {
  tabs: {
    mb: 2,
    borderBottom: "1px solid",
    borderColor: "divider",
    "& .MuiTab-root": { textTransform: "none" },
  },
  tab: { fontSize: "0.9375rem", fontWeight: 600, px: { xs: 1.5, md: 2 } },
  list: {
    listStyle: "none",
    m: 0,
    p: 0,
    display: "grid",
    gap: 1.25,
    columnGap: 3,
    gridTemplateColumns: { xs: "1fr 1fr", sm: "repeat(3, 1fr)", md: "repeat(4, 1fr)" },
  },
  link: { fontSize: "0.875rem", color: "text.primary", textDecoration: "none", "&:hover": { color: "primary.main", textDecoration: "underline" } },
};
