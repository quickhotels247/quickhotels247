export const styles = {
  root: { border: 1, borderColor: "divider", borderRadius: 2.5, p: { xs: 1.5, md: 2 }, m: 0, minWidth: 0 },
  legend: { px: 0.75, fontWeight: 800, fontSize: "0.9375rem" },
  hint: { fontWeight: 400, color: "text.secondary", fontSize: "0.8125rem" },
  grid: { display: "grid", gridTemplateColumns: { xs: "1fr", sm: "100px minmax(0, 1fr) minmax(0, 1fr)" }, gap: 1.5, mt: 1 },
  // Date of birth, PAN and passport rows: equal columns.
  extras: { gridTemplateColumns: { xs: "1fr", sm: "repeat(3, minmax(0, 1fr))" } },
  passport: { gridTemplateColumns: { xs: "1fr", sm: "repeat(3, minmax(0, 1fr))" } },
  menu: { maxHeight: 320 },
  action: { display: "flex", justifyContent: "flex-end", mt: -0.5 },
};
