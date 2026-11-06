export const styles = {
  root: { py: { xs: 3, md: 5 }, display: "flex", flexDirection: "column", gap: 2.5 },
  loading: { display: "flex", flexDirection: "column", gap: 2.5 },
  skeleton: { borderRadius: 3 },
  grid: { display: "grid", gridTemplateColumns: { xs: "minmax(0, 1fr)", md: "minmax(0, 1fr) 340px" }, gap: 2.5, alignItems: "start" },
  main: { display: "flex", flexDirection: "column", gap: 2.5, minWidth: 0 },
  side: { display: "flex", flexDirection: "column", gap: 2.5 },
};
