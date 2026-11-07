export const styles = {
  page: { minHeight: "100dvh", display: "grid", placeItems: "center", p: 2, bgcolor: "background.default" },
  card: { width: "100%", maxWidth: 420, bgcolor: "background.paper", borderRadius: 4, border: 1, borderColor: "divider", p: { xs: 3, sm: 4 }, display: "flex", flexDirection: "column", gap: 1 },
  brand: { display: "flex", alignItems: "center", gap: 1, mb: 1 },
  badge: { fontSize: "0.75rem", fontWeight: 800, textTransform: "uppercase", color: "primary.main", bgcolor: "rgba(26, 86, 219, 0.08)", px: 0.75, py: 0.25, borderRadius: 1 },
  title: { fontSize: "1.5rem", fontWeight: 800 },
  subtitle: { color: "text.secondary", fontSize: "0.9375rem", mb: 1.5 },
};
