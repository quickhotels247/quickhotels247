export const styles = {
  root: { bgcolor: "background.paper", border: 1, borderColor: "divider", borderRadius: 3, p: { xs: 2.5, md: 3 }, display: "flex", flexDirection: "column", gap: 2 },
  title: { fontSize: "1.1rem", fontWeight: 800 },
  method: { display: "flex", alignItems: { xs: "flex-start", sm: "center" }, flexDirection: { xs: "column", sm: "row" }, justifyContent: "space-between", gap: 1.5, pt: 2, borderTop: 1, borderColor: "divider" },
  methodMain: { minWidth: 0 },
  methodName: { fontWeight: 700, display: "flex", alignItems: "center", gap: 1 },
  methodText: { fontSize: "0.85rem", color: "text.secondary", overflowWrap: "anywhere" },
  chip: { height: 22, fontSize: "0.72rem" },
};
