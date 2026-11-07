export const styles = {
  band: { bgcolor: "primary.main", color: "#fff", py: { xs: 5, md: 7 } },
  title: { fontSize: { xs: "2rem", md: "2.75rem" }, fontWeight: 800, letterSpacing: "-0.025em" },
  subtitle: { mt: 1, fontSize: { xs: "1rem", md: "1.125rem" }, opacity: 0.9 },
  chips: { display: "flex", flexWrap: "wrap", gap: 1, mt: 3 },
  chip: { px: 2, py: 0.75, borderRadius: 999, bgcolor: "rgba(255,255,255,0.14)", color: "#fff", textDecoration: "none", fontWeight: 600, fontSize: "0.875rem", "&:hover": { bgcolor: "rgba(255,255,255,0.24)" } },
  chipPrimary: { bgcolor: "#fff", color: "primary.main", "&:hover": { bgcolor: "#f1f5ff" } },
  body: { py: { xs: 4, md: 6 }, display: "flex", flexDirection: "column", gap: 4 },
  contact: { scrollMarginTop: 96, display: "flex", flexDirection: "column", gap: 1.5 },
  email: { display: "flex", alignItems: "center", gap: 0.75, color: "text.secondary", fontSize: "0.875rem", flexWrap: "wrap" },
};
