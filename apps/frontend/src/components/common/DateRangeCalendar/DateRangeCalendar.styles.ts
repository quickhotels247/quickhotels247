export const styles = {
  root: { position: "relative", userSelect: "none" },
  nav: (side: "left" | "right") => ({ position: "absolute", top: -6, [side]: -6, zIndex: 1 }),
  months: { display: "grid", gap: 4, gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" } },
  // Phones show one month at a time.
  secondMonth: { display: { xs: "none", sm: "block" } },
};
