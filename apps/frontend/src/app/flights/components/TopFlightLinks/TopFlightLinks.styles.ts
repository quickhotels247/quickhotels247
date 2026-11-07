export const styles = {
  // Leaves room under the sticky header when the "Anywhere" card jumps here.
  root: { scrollMarginTop: 96 },
  tabs: { display: "flex", gap: 1, mb: 2.5, overflowX: "auto", scrollbarWidth: "none", "&::-webkit-scrollbar": { display: "none" } },
  tab: (selected: boolean) => ({
    flexShrink: 0,
    px: 2,
    py: 0.9,
    borderRadius: 999,
    fontSize: "0.9375rem",
    fontWeight: 600,
    border: "1px solid",
    borderColor: selected ? "primary.main" : "transparent",
    color: selected ? "primary.main" : "text.primary",
    bgcolor: selected ? "primary.light" : "transparent",
    "&:hover": { bgcolor: selected ? "primary.light" : "action.hover" },
    "&.Mui-focusVisible": { outline: "2px solid", outlineColor: "primary.main", outlineOffset: 2 },
  }),
  list: {
    listStyle: "none",
    m: 0,
    p: 0,
    display: "grid",
    gap: 1,
    columnGap: 3,
    gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", md: "repeat(3, 1fr)" },
  },
};
