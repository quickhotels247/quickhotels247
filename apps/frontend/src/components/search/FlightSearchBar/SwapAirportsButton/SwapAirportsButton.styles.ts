export const styles = {
  root: {
    display: "flex",
    alignItems: "center",
    justifyContent: { xs: "flex-end", md: "center" },
    height: { xs: 0, md: "auto" },
    position: "relative",
    zIndex: 1,
    px: { md: 0.5 },
    // On phones it floats over the gap between the From and To boxes.
    mr: { xs: 2, md: 0 },
  },
  button: {
    width: 36,
    height: 36,
    border: "1px solid",
    borderColor: "divider",
    bgcolor: "background.paper",
    color: "primary.main",
    transform: { xs: "rotate(90deg)", md: "none" },
    "&:hover": { bgcolor: "primary.light" },
  },
};
