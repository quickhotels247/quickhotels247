export const styles = {
  content: { display: "flex", flexDirection: "column", gap: 2, pt: "8px !important" },
  pair: { display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2, alignItems: "start" },
  preview: { bgcolor: "primary.light", borderRadius: 2, px: 2, py: 1.5, display: "flex", flexDirection: "column", gap: 0.5 },
  previewText: { fontSize: "0.875rem" },
  strike: { textDecoration: "line-through", color: "text.secondary" },
  actions: { px: 3, pb: 2 },
};
