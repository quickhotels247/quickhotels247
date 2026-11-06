export const styles = {
  root: {
    width: "100%",
    bgcolor: "background.paper",
    borderRadius: { xs: 3, md: 2.5 },
    boxShadow: "0 12px 40px -12px rgba(15, 23, 42, 0.35)",
    p: { xs: 1.5, md: 1.25 },
  },
  options: { display: "flex", flexWrap: "wrap", alignItems: "center", gap: { xs: 1, md: 2 }, px: 0.5, pb: 1 },
  direct: { m: 0, "& .MuiFormControlLabel-label": { fontSize: "0.88rem" } },
  fields: {
    display: "grid",
    gap: { xs: 1, md: 0 },
    gridTemplateColumns: {
      xs: "1fr",
      md: "minmax(0, 1.2fr) auto minmax(0, 1.2fr) minmax(0, 1.25fr) minmax(0, 1fr) auto",
    },
    alignItems: "stretch",
    position: "relative",
  },
  multiFooter: {
    display: "grid",
    gap: { xs: 1, md: 0 },
    gridTemplateColumns: { xs: "1fr", md: "minmax(0, 260px) auto" },
    justifyContent: { md: "end" },
    alignItems: "stretch",
    mt: 1,
  },
  submit: { px: 3, minHeight: 48, whiteSpace: "nowrap", mt: { xs: 0.5, md: 0 }, ml: { md: 1 } },
  error: { mt: 1, px: 1, fontSize: "0.85rem", color: "error.main" },
  pending: { mt: 1, px: 1, fontSize: "0.85rem", color: "text.secondary", fontWeight: 600 },
};
