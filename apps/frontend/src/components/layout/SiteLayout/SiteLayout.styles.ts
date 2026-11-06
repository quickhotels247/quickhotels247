import { BOTTOM_NAV_HEIGHT } from "../BottomNav/BottomNav.styles";

export const styles = {
  root: {
    minHeight: "100dvh",
    display: "flex",
    flexDirection: "column",
    // Room for the fixed tab bar on phones.
    pb: { xs: `${BOTTOM_NAV_HEIGHT}px`, md: 0 },
  },
  main: { flex: 1 },
};
