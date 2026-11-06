import type { CSSProperties } from "react";

export const styles = {
  root: {
    display: "inline-flex",
    alignItems: "center",
    flexShrink: 0,
    // The image is 4:1, so this height sets the width too.
    height: { xs: 40, md: 54 },
    borderRadius: 1,
    "&:focus-visible": { outline: "2px solid", outlineColor: "primary.main", outlineOffset: 4 },
  },
  image: { height: "100%", width: "auto" } satisfies CSSProperties,
};
