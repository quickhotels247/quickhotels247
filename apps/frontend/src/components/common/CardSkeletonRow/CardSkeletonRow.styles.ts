export const styles = {
  row: { display: "grid", gap: { xs: 1.5, md: 2 }, gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(4, 1fr)" } },
  // Phones show two placeholders.
  card: (index: number) => ({ display: { xs: index < 2 ? "block" : "none", md: "block" } }),
  photo: { width: "100%", height: "auto", borderRadius: 3, mb: 1 },
};
