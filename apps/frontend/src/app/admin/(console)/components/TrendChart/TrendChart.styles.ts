export const styles = {
  chart: { display: "flex", alignItems: "flex-end", gap: "2px", height: 160, pt: 1, borderBottom: 1, borderColor: "divider" },
  column: { flex: 1, minWidth: 0, height: "100%", display: "flex", alignItems: "flex-end", "&:hover > div": { bgcolor: "primary.dark" } },
  bar: { width: "100%", bgcolor: "primary.main", borderRadius: "3px 3px 0 0", minHeight: 2 },
  empty: { width: "100%", height: 2, bgcolor: "divider" },
  axis: { display: "flex", justifyContent: "space-between", mt: 0.75, fontSize: "0.75rem", color: "text.secondary" },
};
