export const styles = {
  root: { display: "flex", flexDirection: "column", gap: 2 },
  message: { fontSize: "0.9375rem", fontWeight: 600, color: "primary.main" },
  card: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 2, p: 2.25, borderRadius: 3, border: 1, borderColor: "divider", bgcolor: "background.paper" },
  row: { display: "flex", alignItems: "center", gap: 2, flex: 1 },
  price: { display: { xs: "none", sm: "flex" }, flexDirection: "column", alignItems: "flex-end", gap: 1 },
};
