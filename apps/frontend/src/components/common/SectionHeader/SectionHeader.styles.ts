export const styles = {
  root: { display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 2, mb: { xs: 2, md: 2.5 } },
  title: { fontSize: { xs: "1.2rem", md: "1.5rem" } },
  subtitle: { mt: 0.5, fontSize: { xs: "0.875rem", md: "0.9375rem" }, color: "text.secondary" },
  link: {
    display: "inline-flex",
    alignItems: "center",
    gap: 0.5,
    fontSize: "0.875rem",
    fontWeight: 600,
    textDecoration: "none",
    whiteSpace: "nowrap",
    "&:hover": { textDecoration: "underline" },
  },
  icon: { fontSize: 16 },
};
