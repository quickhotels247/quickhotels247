export const styles = {
  root: { bgcolor: "background.paper", border: 1, borderColor: "divider", borderRadius: 3, p: { xs: 2.5, md: 3 }, display: "flex", flexDirection: "column", gap: 2 },
  title: { fontSize: "1.05rem", fontWeight: 800 },
  section: { fontSize: "0.95rem", fontWeight: 700, mt: 1 },
  optional: { fontWeight: 400, color: "text.secondary", fontSize: "0.85rem" },
  pair: { display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 },
  three: { display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(3, minmax(0, 1fr))" }, gap: 2 },
  phone: { display: "grid", gridTemplateColumns: "90px minmax(0, 1fr)", gap: 1.5, maxWidth: { sm: "calc(50% + 45px)" } },
  menu: { maxHeight: 320 },
  submit: { alignSelf: "flex-start" },
};
