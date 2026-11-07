export const styles = {
  root: { display: "flex", gap: 2, p: { xs: 2.5, md: 3.5 }, borderRadius: 3, border: 1 },
  good: { bgcolor: "rgba(22, 163, 74, 0.07)", borderColor: "rgba(22, 163, 74, 0.35)", "& .banner-icon, & svg": { color: "success.main" } },
  waiting: { bgcolor: "rgba(245, 165, 36, 0.10)", borderColor: "rgba(245, 165, 36, 0.45)", "& svg": { color: "#b7791f" } },
  bad: { bgcolor: "rgba(211, 47, 47, 0.06)", borderColor: "rgba(211, 47, 47, 0.35)", "& svg": { color: "error.main" } },
  neutral: { bgcolor: "background.paper", borderColor: "divider", "& svg": { color: "text.secondary" } },
  icon: { "& svg": { fontSize: { xs: 36, md: 44 } } },
  body: { display: "flex", flexDirection: "column", gap: 1, minWidth: 0 },
  title: { fontSize: { xs: "1.35rem", md: "1.7rem" }, fontWeight: 800 },
  text: { color: "text.secondary", fontSize: "0.9375rem" },
  refs: { display: "flex", flexWrap: "wrap", gap: { xs: 0.5, md: 3 }, mt: 0.5 },
  ref: { fontSize: "0.9375rem" },
  check: { alignSelf: "flex-start", mt: 0.5 },
};
