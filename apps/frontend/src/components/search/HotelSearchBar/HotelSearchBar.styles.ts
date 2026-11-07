export const styles = {
  root: {
    width: "100%",
    bgcolor: "background.paper",
    borderRadius: { xs: 3, md: 2.5 },
    boxShadow: "0 12px 40px -12px rgba(15, 23, 42, 0.35)",
    p: { xs: 1.5, md: 1 },
  },
  fields: {
    display: "grid",
    gap: { xs: 1, md: 0 },
    gridTemplateColumns: { xs: "1fr", md: "minmax(0, 1.4fr) minmax(0, 1.2fr) minmax(0, 0.9fr) auto" },
    alignItems: "stretch",
  },
  submit: {
    px: 3,
    minHeight: 48,
    whiteSpace: "nowrap",
    mt: { xs: 0.5, md: 0 },
    ml: { md: 1 },
  },
  error: { mt: 1, px: 1, fontSize: "0.875rem", color: "error.main" },
  pending: { mt: 1, px: 1, fontSize: "0.875rem", color: "text.secondary", fontWeight: 600 },
};
