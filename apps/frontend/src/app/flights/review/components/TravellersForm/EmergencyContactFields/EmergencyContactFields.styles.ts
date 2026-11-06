export const styles = {
  grid: { display: "grid", gridTemplateColumns: { xs: "88px minmax(0, 1fr)", sm: "minmax(0, 1.4fr) 88px minmax(0, 1fr)" }, gap: 1.5, mt: 1.5, "& > :first-of-type": { gridColumn: { xs: "1 / -1", sm: "auto" } } },
};
