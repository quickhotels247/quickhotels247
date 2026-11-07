export const styles = {
  list: { listStyle: "none", m: 0, p: 0, display: "grid", gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(4, 1fr)" }, gap: 1.25 },
  item: { display: "flex", alignItems: "flex-start", gap: 0.75, fontSize: "0.875rem" },
  icon: { fontSize: 18, color: "success.main", mt: "1px", flexShrink: 0 },
  more: { mt: 1.5, px: 0, minWidth: 0 },
};
