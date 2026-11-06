export const styles = {
  card: {
    height: "100%",
    borderRadius: 3,
    transition: "box-shadow 0.2s, transform 0.2s",
    "&:hover": { boxShadow: "0 12px 28px -12px rgba(15,23,42,0.25)", transform: "translateY(-2px)" },
  },
  action: { height: "100%", display: "flex", flexDirection: "column", alignItems: "stretch" },
  media: { position: "relative", aspectRatio: "4 / 3", overflow: "hidden" },
  body: { px: 1.5, py: 1.25 },
  name: { fontWeight: 700, fontSize: "0.98rem" },
  count: { fontSize: "0.8rem", color: "text.secondary" },
};
