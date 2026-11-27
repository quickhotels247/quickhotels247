export const styles = {
  list: { listStyle: "none", m: 0, p: 0 },
  row: { display: "flex", alignItems: "center", gap: 1.5, py: 1.25, color: "inherit", textDecoration: "none", "& + &": { borderTop: 1, borderColor: "divider" }, "&:hover .ref": { textDecoration: "underline" } },
  main: { flex: 1, minWidth: 0 },
  title: { fontWeight: 700, fontSize: "0.9375rem", display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" },
  meta: { fontSize: "0.8125rem", color: "text.secondary", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  side: { textAlign: "right", flexShrink: 0 },
  amount: { fontWeight: 700, fontSize: "0.875rem" },
  time: { fontSize: "0.75rem", color: "text.secondary" },
  urgent: { color: "error.main", fontWeight: 700 },
  empty: { color: "text.secondary", fontSize: "0.9375rem" },
  chip: { height: 22, fontSize: "0.75rem", fontWeight: 600 },
};
