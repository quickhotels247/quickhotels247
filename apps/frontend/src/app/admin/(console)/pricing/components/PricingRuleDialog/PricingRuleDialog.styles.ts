export const styles = {
  content: { display: "flex", flexDirection: "column", gap: 2, pt: "8px !important" },
  pair: { display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2, alignItems: "start" },
  three: { display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr 120px" }, gap: 2, alignItems: "start" },
  preview: { bgcolor: "primary.light", borderRadius: 2, px: 2, py: 1.5 },
  previewText: { fontSize: "0.875rem" },
  actions: { px: 3, pb: 2 },
};
