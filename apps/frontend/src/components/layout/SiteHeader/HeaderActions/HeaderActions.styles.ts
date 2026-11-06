export const styles = {
  root: { display: "flex", alignItems: "center", ml: { xs: "auto", md: 2.5 } },
  desktop: { display: { xs: "none", md: "flex" }, alignItems: "center", gap: 1 },
  mobile: { display: { xs: "flex", md: "none" }, alignItems: "center", gap: 0.5 },
  register: { px: 2, borderColor: "divider", color: "primary.main", "&:hover": { borderColor: "primary.main", bgcolor: "primary.light" } },
  signIn: { px: 2.25 },
  icon: { color: "text.primary" },
};
