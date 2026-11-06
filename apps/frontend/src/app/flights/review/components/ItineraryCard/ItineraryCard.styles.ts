export const styles = {
  root: { bgcolor: "background.paper", border: 1, borderColor: "divider", borderRadius: 3, p: { xs: 2, md: 3 }, display: "flex", flexDirection: "column", gap: 2.5 },
  heading: { fontSize: "1.1rem", fontWeight: 800 },
  journey: { display: "flex", flexDirection: "column", gap: 1.5, "& + &": { pt: 2.5, borderTop: 1, borderColor: "divider" } },
  journeyTitle: { fontSize: "0.82rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: 0.3, color: "text.secondary" },
  segments: { pl: { sm: 1 } },
  fares: { display: "flex", flexDirection: "column", gap: 1.25 },
  fare: { display: "flex", flexDirection: "column", gap: 0.75 },
  fareLabel: { fontSize: "0.82rem", fontWeight: 700 },
  chips: { display: "flex", gap: 0.75, flexWrap: "wrap" },
  capital: { textTransform: "capitalize" },
};
