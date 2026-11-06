export const styles = {
  trigger: {
    flex: 1,
    justifyContent: "flex-start",
    minHeight: 46,
    fontSize: "0.92rem",
    fontWeight: 600,
    color: "text.primary",
    textAlign: "left",
    borderRadius: 1,
  },
  triggerInvalid: { color: "error.main" },
  paper: { p: 2, mt: 1, width: { xs: "calc(100vw - 32px)", sm: 340 }, maxHeight: "80vh", borderRadius: 3 },
  ages: { pt: 1.5 },
  agesHint: { fontSize: "0.78rem", color: "text.secondary", mb: 1.5 },
  agesGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1.5 },
  done: { mt: 2 },
};
