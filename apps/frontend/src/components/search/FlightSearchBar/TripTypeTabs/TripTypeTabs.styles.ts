export const styles = {
  group: { gap: 0.75, "& .MuiToggleButtonGroup-grouped": { border: "1px solid", borderColor: "divider", borderRadius: "999px !important", m: 0 } },
  button: {
    px: 1.75,
    py: 0.5,
    fontSize: "0.85rem",
    fontWeight: 600,
    color: "text.primary",
    "&.Mui-selected": { color: "primary.main", bgcolor: "primary.light", borderColor: "primary.main" },
    "&.Mui-selected:hover": { bgcolor: "primary.light" },
  },
};
