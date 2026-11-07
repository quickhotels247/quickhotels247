export const styles = {
  root: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2, py: 1.25 },
  label: { fontWeight: 600, fontSize: "0.9375rem" },
  hint: { fontSize: "0.8125rem", color: "text.secondary" },
  controls: { display: "flex", alignItems: "center", gap: 1 },
  button: { border: "1px solid", borderColor: "divider", "&:not(:disabled)": { color: "primary.main" } },
  value: { minWidth: 20, textAlign: "center", fontWeight: 700 },
};
