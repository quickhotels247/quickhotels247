export const styles = {
  root: {
    display: "flex",
    flexDirection: { xs: "column", sm: "row" },
    alignItems: "center",
    justifyContent: "center",
    textAlign: { xs: "center", sm: "left" },
    gap: { xs: 0.75, sm: 1.5 },
  },
  badge: {
    flexShrink: 0,
    width: { xs: 40, md: 48 },
    height: { xs: 40, md: 48 },
    borderRadius: "50%",
    display: "grid",
    placeItems: "center",
    bgcolor: "primary.light",
    color: "primary.main",
    "& svg": { fontSize: { xs: 20, md: 24 } },
  },
  text: { fontSize: { xs: "0.75rem", md: "0.9375rem" }, fontWeight: 600, lineHeight: 1.35 },
};
