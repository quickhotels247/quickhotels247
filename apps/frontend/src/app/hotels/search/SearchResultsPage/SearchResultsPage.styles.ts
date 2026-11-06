export const styles = {
  searchBand: { bgcolor: "primary.main", py: { xs: 2, md: 2.5 } },
  body: { py: { xs: 2.5, md: 4 } },
  alert: { mb: 2, borderRadius: 2 },
  layout: {
    display: "grid",
    gridTemplateColumns: { xs: "minmax(0, 1fr)", md: "260px minmax(0, 1fr)" },
    gap: { md: 3 },
    alignItems: "start",
  },
  // Sticky beside the results; scrolls on its own when taller than the screen.
  sidebar: {
    display: { xs: "none", md: "block" },
    position: "sticky",
    top: 96,
    maxHeight: "calc(100vh - 112px)",
    overflowY: "auto",
    overscrollBehavior: "contain",
    borderRadius: 3,
  },
  main: { minWidth: 0, scrollMarginTop: 96 },
  list: { listStyle: "none", m: 0, p: 0, display: "flex", flexDirection: "column", gap: 2, transition: "opacity 0.2s" },
  listLoading: { opacity: 0.55, pointerEvents: "none" },
  drawer: { maxHeight: "88vh", borderTopLeftRadius: 16, borderTopRightRadius: 16 },
  drawerBody: { overflowY: "auto", p: 2, "& > div": { border: 0 } },
  drawerFooter: { p: 2, borderTop: 1, borderColor: "divider" },
};
