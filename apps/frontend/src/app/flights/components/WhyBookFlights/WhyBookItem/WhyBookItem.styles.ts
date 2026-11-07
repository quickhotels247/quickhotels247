export const styles = {
  root: {
    display: "flex",
    gap: 1.5,
    alignItems: "flex-start",
    p: 2,
    borderRadius: 3,
    bgcolor: "background.paper",
    border: "1px solid",
    borderColor: "divider",
  },
  badge: {
    flexShrink: 0,
    width: 44,
    height: 44,
    borderRadius: "50%",
    display: "grid",
    placeItems: "center",
    bgcolor: "primary.light",
    color: "primary.main",
  },
  title: { fontWeight: 700, fontSize: "1rem" },
  text: { mt: 0.25, fontSize: "0.875rem", color: "text.secondary" },
};
