export const styles = {
  root: (invalid: boolean, labelled: boolean) => ({
    position: "relative",
    display: "flex",
    alignItems: "center",
    gap: 1.25,
    minHeight: labelled ? 56 : 48,
    px: 1.5,
    borderRadius: "10px",
    border: { xs: "1px solid", md: "none" },
    borderColor: invalid ? "error.main" : "divider",
    bgcolor: invalid ? { xs: "transparent", md: "rgba(220, 38, 38, 0.05)" } : "transparent",
    // Divider between fields in the one-row layout.
    "&:not(:first-of-type)::before": {
      content: '""',
      display: { xs: "none", md: "block" },
      position: "absolute",
      left: 0,
      top: 10,
      bottom: 10,
      width: "1px",
      bgcolor: "divider",
    },
  }),
  icon: { display: "flex", color: "text.secondary", "& svg": { fontSize: 20 } },
  labelled: { flex: 1, minWidth: 0, display: "flex", flexDirection: "column", py: 0.5 },
  label: { fontSize: "0.72rem", fontWeight: 600, color: "text.secondary", lineHeight: 1.2 },
};
