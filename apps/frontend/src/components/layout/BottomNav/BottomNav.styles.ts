// Height of the bar, so page content can leave room for it.
export const BOTTOM_NAV_HEIGHT = 64;

export const styles = {
  root: {
    display: { xs: "block", md: "none" },
    position: "fixed",
    insetInline: 0,
    bottom: 0,
    zIndex: "appBar",
    borderTop: "1px solid",
    borderColor: "divider",
    pb: "env(safe-area-inset-bottom)",
  },
  bar: { height: BOTTOM_NAV_HEIGHT },
  action: {
    color: "text.secondary",
    "& .MuiBottomNavigationAction-label": { fontSize: "0.75rem", mt: 0.25 },
    "&.Mui-selected": { color: "primary.main" },
    "& .MuiBottomNavigationAction-label.Mui-selected": { fontSize: "0.75rem", fontWeight: 600 },
  },
};
