export const styles = {
  paper: { width: { xs: "85vw", sm: 340 }, maxWidth: 360 },
  header: { display: "flex", alignItems: "center", justifyContent: "space-between", px: 2, py: 1.5 },
  list: { px: 1, py: 1.5 },
  item: { borderRadius: 2, mb: 0.5 },
  icon: (active: boolean) => ({ minWidth: 40, color: active ? "primary.main" : "text.secondary" }),
  actions: { mt: "auto", p: 2, display: "flex", flexDirection: "column", gap: 1.25 },
};
