export const styles = {
  card: { bgcolor: "background.paper", border: 1, borderColor: "divider", borderRadius: 3, p: { xs: 2.5, md: 3.5 }, display: "flex", flexDirection: "column", gap: 2 },
  title: { fontSize: "1.375rem", fontWeight: 800 },
  text: { color: "text.secondary", fontSize: "0.9375rem" },
  pair: { display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2, alignItems: "start" },
  phone: { maxWidth: { sm: "calc(50% - 8px)" } },
  submit: { alignSelf: "flex-start" },
  done: { alignItems: "center", textAlign: "center", py: 5 },
  doneIcon: { fontSize: 48 },
  doneTitle: { fontSize: "1.25rem", fontWeight: 800 },
};
