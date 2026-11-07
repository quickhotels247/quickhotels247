export const styles = {
  root: { display: "flex", flexDirection: "column", gap: 2.5 },
  grid: { display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 },
  wide: { gridColumn: { sm: "1 / -1" } },
  switch: { fontSize: "0.9375rem", color: "text.secondary", textAlign: "center" },
  link: { fontWeight: 600 },
};
