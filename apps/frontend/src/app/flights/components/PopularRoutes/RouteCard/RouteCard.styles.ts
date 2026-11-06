export const styles = {
  card: { width: "100%", borderRadius: 3, transition: "box-shadow 0.2s", "&:hover": { boxShadow: "0 12px 28px -12px rgba(15,23,42,0.25)" } },
  action: { height: "100%", display: "flex", flexDirection: "column", alignItems: "stretch", justifyContent: "flex-start" },
  media: { position: "relative", aspectRatio: "16 / 10" },
  body: { p: 1.5, display: "flex", flexDirection: "column", gap: 0.25, flex: 1 },
  route: { display: "flex", alignItems: "center", gap: 0.5, flexWrap: "wrap", fontWeight: 700, fontSize: "0.98rem" },
  arrow: { fontSize: 16, color: "text.secondary" },
  meta: { fontSize: "0.8rem", color: "text.secondary" },
  price: { mt: "auto", pt: 1, fontSize: "0.82rem", color: "text.secondary" },
  amount: { fontSize: "1.1rem", fontWeight: 800, color: "text.primary" },
  note: { fontSize: "0.72rem", color: "text.secondary" },
};
