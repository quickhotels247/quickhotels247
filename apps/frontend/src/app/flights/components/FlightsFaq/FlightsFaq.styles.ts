export const styles = {
  grid: { display: "grid", gap: { xs: 0, md: 3 }, gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, alignItems: "start" },
  column: {
    bgcolor: "background.paper",
    border: "1px solid",
    borderColor: "divider",
    borderRadius: 3,
    px: 2,
    // Stacked on phones, the two columns read as one list.
    "&:first-of-type": { borderBottomLeftRadius: { xs: 0, md: 12 }, borderBottomRightRadius: { xs: 0, md: 12 } },
    "&:last-of-type": { borderTopLeftRadius: { xs: 0, md: 12 }, borderTopRightRadius: { xs: 0, md: 12 }, borderTop: { xs: "none", md: "1px solid" }, borderTopColor: { md: "divider" } },
  },
};
