export const styles = {
  band: { color: "#fff", py: { xs: 5, md: 8 } },
  plain: { bgcolor: "primary.main" },
  photo: (url: string) => ({
    backgroundImage: `linear-gradient(180deg, rgba(15,23,42,0.55), rgba(15,23,42,0.75)), url(${url})`,
    backgroundSize: "cover",
    backgroundPosition: "center",
  }),
  title: { fontSize: { xs: "2rem", md: "3rem" }, fontWeight: 800, letterSpacing: "-0.025em" },
  subtitle: { mt: 1, fontSize: { xs: "1rem", md: "1.125rem" }, opacity: 0.92, maxWidth: 720 },
  search: { mt: { xs: 3, md: 4 } },
  body: { py: { xs: 4, md: 6 }, display: "flex", flexDirection: "column", gap: 5 },
  h2: { fontSize: { xs: "1.375rem", md: "1.625rem" }, fontWeight: 800, mb: 1.5 },
  text: { color: "text.secondary", fontSize: "1rem", maxWidth: 760, lineHeight: 1.7 },
  points: { listStyle: "none", p: 0, m: 0, mt: 2, display: "flex", flexDirection: "column", gap: 1 },
  point: { display: "flex", alignItems: "center", gap: 1, fontSize: "0.9375rem" },
  links: { display: "flex", flexWrap: "wrap", gap: 1 },
  link: { px: 1.75, py: 0.75, borderRadius: 999, border: 1, borderColor: "divider", bgcolor: "background.paper", color: "text.primary", textDecoration: "none", fontSize: "0.875rem", fontWeight: 600, "&:hover": { borderColor: "primary.main", color: "primary.main" } },
};
