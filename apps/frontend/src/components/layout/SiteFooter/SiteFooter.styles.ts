export const styles = {
  root: { mt: { xs: 6, md: 10 }, py: { xs: 4, md: 5 }, bgcolor: "background.paper", borderTop: "1px solid", borderColor: "divider" },
  container: {
    display: "grid",
    gap: 2,
    gridTemplateColumns: { xs: "1fr", md: "1fr auto" },
    alignItems: "center",
  },
  brand: { display: "flex", flexDirection: "column", gap: 1 },
  links: { display: "flex", flexWrap: "wrap", gap: { xs: 2, md: 3 } },
  link: { color: "text.secondary", fontSize: "0.9375rem", textDecoration: "none", "&:hover": { color: "primary.main" } },
  copyright: { gridColumn: { md: "1 / -1" } },
};
