export const styles = {
  card: {
    height: "100%",
    borderRadius: 3,
    display: "grid",
    gridTemplateColumns: { xs: "1fr", sm: "1fr 40%" },
    overflow: "hidden",
  },
  body: { p: { xs: 2, md: 2.5 }, display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 1 },
  title: { fontWeight: 800, fontSize: { xs: "1.125rem", md: "1.25rem" } },
  description: { fontSize: "0.9375rem", color: "text.secondary", flex: 1 },
  cta: { mt: 1 },
  media: { position: "relative", minHeight: { xs: 150, sm: "100%" }, order: { xs: -1, sm: 0 } },
};
