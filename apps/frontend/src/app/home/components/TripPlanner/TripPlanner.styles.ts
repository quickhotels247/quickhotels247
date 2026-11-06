export const styles = {
  tabs: {
    minHeight: 0,
    mb: 2,
    "& .MuiTabs-indicator": { display: "none" },
    "& .MuiTabs-flexContainer": { gap: 1 },
  },
  tab: {
    minHeight: 0,
    py: 0.9,
    px: 2,
    borderRadius: 999,
    border: "1px solid",
    borderColor: "divider",
    fontSize: "0.88rem",
    color: "text.primary",
    bgcolor: "background.paper",
    "&.Mui-selected": { color: "primary.main", borderColor: "primary.main", bgcolor: "primary.light" },
  },
  panel: { minHeight: 120 },
};
