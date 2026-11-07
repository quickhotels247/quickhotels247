export const styles = {
  root: { bgcolor: "background.paper", border: 1, borderColor: "divider", borderRadius: 3, overflow: "hidden", display: "flex", flexDirection: "column" },
  media: { position: "relative", aspectRatio: "4 / 3", bgcolor: "action.hover" },
  photoLink: { position: "absolute", inset: 0, display: "block" },
  heart: { position: "absolute", top: 8, right: 8 },
  body: { p: 2, display: "flex", flexDirection: "column", gap: 0.5 },
  name: { fontWeight: 800, fontSize: "1rem", lineHeight: 1.3 },
  nameLink: { color: "inherit", textDecoration: "none", "&:hover": { textDecoration: "underline" } },
  place: { fontSize: "0.875rem", color: "text.secondary" },
};
