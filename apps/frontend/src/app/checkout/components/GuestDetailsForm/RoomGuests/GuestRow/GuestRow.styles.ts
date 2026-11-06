export const styles = {
  root: { "& + &": { mt: 2 } },
  head: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1, mb: 1, minHeight: 30 },
  label: { fontSize: "0.82rem", fontWeight: 700, color: "text.secondary" },
  grid: { display: "grid", gridTemplateColumns: { xs: "96px minmax(0, 1fr)", sm: "110px minmax(0, 1fr) minmax(0, 1fr)" }, gap: 1.5 },
  title: {},
  wide: { gridColumn: { xs: "1 / -1", sm: "2 / span 2" } },
};
