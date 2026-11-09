export const styles = {
  card: {
    position: "relative",
    width: "100%",
    borderRadius: 3,
    transition: "box-shadow 0.2s",
    "&:hover": { boxShadow: "0 12px 28px -12px rgba(15,23,42,0.25)" },
  },
  action: { height: "100%", display: "flex", flexDirection: "column", alignItems: "stretch", justifyContent: "flex-start" },
  media: { position: "relative", aspectRatio: "4 / 3" },
  body: { p: 1.5, display: "flex", flexDirection: "column", gap: 0.5, flex: 1 },
  name: { fontWeight: 700, fontSize: "1rem", lineHeight: 1.3 },
  location: { display: "flex", alignItems: "center", gap: 0.5, fontSize: "0.8125rem", color: "text.secondary" },
  locationIcon: { fontSize: 16 },
  price: { mt: "auto", pt: 1, textAlign: "right" },
  // Top-right of the photo.
  heart: { position: "absolute", top: 8, right: 8, zIndex: 1 },
  taxes: { fontSize: "0.75rem", color: "text.secondary" },
};
