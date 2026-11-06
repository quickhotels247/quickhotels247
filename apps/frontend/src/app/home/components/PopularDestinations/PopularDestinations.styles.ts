export const styles = {
  list: {
    listStyle: "none",
    m: 0,
    p: 0,
    display: "grid",
    gap: { xs: 1.5, md: 2.5 },
    // Phones scroll sideways with cards snapping into place.
    gridAutoFlow: { xs: "column", md: "row" },
    gridAutoColumns: { xs: "42%", sm: "30%" },
    gridTemplateColumns: { md: "repeat(4, minmax(0, 1fr))" },
    overflowX: { xs: "auto", md: "visible" },
    scrollSnapType: { xs: "x mandatory", md: "none" },
    // Snap cards to the page margin, not the screen edge.
    scrollPaddingInline: { xs: "16px", sm: "24px" },
    scrollbarWidth: "none",
    "&::-webkit-scrollbar": { display: "none" },
    // Let the row run to the screen edge on phones.
    mx: { xs: -2, sm: -3, md: 0 },
    px: { xs: 2, sm: 3, md: 0 },
    pb: { xs: 0.5, md: 0 },
  },
  item: { scrollSnapAlign: "start", minWidth: 0 },
};
