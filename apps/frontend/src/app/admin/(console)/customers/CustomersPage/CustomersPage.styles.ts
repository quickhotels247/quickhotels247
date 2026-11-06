export const styles = {
  search: { width: { xs: "100%", sm: 340 }, mb: 2, "& .MuiInputBase-root": { borderRadius: 2, bgcolor: "background.paper" } },
  table: { bgcolor: "background.paper", border: 1, borderColor: "divider", borderRadius: 3, transition: "opacity 0.2s" },
  loading: { opacity: 0.6 },
  row: { cursor: "pointer" },
  username: { fontSize: "0.75rem", color: "text.secondary" },
  wide: { display: { xs: "none", md: "table-cell" } },
  empty: { textAlign: "center", color: "text.secondary", py: 4 },
  pagination: { display: "flex", justifyContent: "center", mt: 2 },
};
