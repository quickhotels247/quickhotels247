export const styles = {
  trigger: (filled: boolean) => ({
    flex: 1,
    justifyContent: "flex-start",
    minHeight: 46,
    fontSize: "0.9375rem",
    fontWeight: filled ? 600 : 400,
    color: filled ? "text.primary" : "text.secondary",
    textAlign: "left",
    borderRadius: 1,
  }),
  paper: { p: { xs: 2, sm: 3 }, mt: 1, width: { xs: "calc(100vw - 32px)", sm: 660 }, maxWidth: "100%", borderRadius: 3 },
  footer: {
    mt: 2,
    pt: 2,
    borderTop: "1px solid",
    borderColor: "divider",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 2,
  },
  summary: { fontSize: "0.9375rem", fontWeight: 600 },
};
