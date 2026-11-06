export const styles = {
  root: {
    width: "100%",
    display: "block",
    color: "inherit",
    textDecoration: "none",
    borderRadius: 3,
    "&:hover img, &:focus-visible img": { transform: "scale(1.05)" },
    "&:focus-visible": { outline: "2px solid", outlineColor: "primary.main", outlineOffset: 3 },
  },
  media: {
    position: "relative",
    aspectRatio: "16 / 10",
    borderRadius: 3,
    overflow: "hidden",
    "& img": { transition: "transform 0.35s ease" },
  },
  name: { mt: 1, fontWeight: 700, fontSize: "0.98rem" },
  state: { fontSize: "0.8rem", color: "text.secondary" },
};
