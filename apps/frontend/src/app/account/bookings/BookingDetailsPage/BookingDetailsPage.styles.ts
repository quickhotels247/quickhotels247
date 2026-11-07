export const styles = {
  root: { py: { xs: 3, md: 5 }, display: "flex", flexDirection: "column", gap: 2.5 },
  crumbs: { fontSize: "0.875rem" },
  crumbCurrent: { fontSize: "0.875rem", color: "text.primary" },
  header: { display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 2, flexWrap: "wrap" },
  title: { fontSize: { xs: "1.4rem", md: "1.8rem" }, fontWeight: 800 },
  sub: { color: "text.secondary", fontSize: "0.9375rem" },
  grid: { display: "grid", gridTemplateColumns: { xs: "minmax(0, 1fr)", md: "minmax(0, 1fr) 340px" }, gap: 2.5, alignItems: "start" },
  main: { display: "flex", flexDirection: "column", gap: 2.5, minWidth: 0 },
  side: { display: "flex", flexDirection: "column", gap: 2.5, position: { md: "sticky" }, top: { md: 96 } },
  skeleton: { borderRadius: 3 },
};
