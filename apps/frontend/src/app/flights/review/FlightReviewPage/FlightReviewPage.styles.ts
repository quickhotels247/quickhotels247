export const styles = {
  page: { py: { xs: 2, md: 4 } },
  top: { display: "flex", flexDirection: "column", gap: 2.5, mb: 3 },
  title: { display: "flex", alignItems: "center", gap: 1, fontSize: { xs: "1.4rem", md: "1.75rem" }, fontWeight: 800 },
  lock: { color: "success.main" },
  layout: { display: "grid", gridTemplateColumns: { xs: "minmax(0, 1fr)", md: "minmax(0, 1fr) 360px" }, gap: 3, alignItems: "start" },
  main: { display: "flex", flexDirection: "column", gap: 2, minWidth: 0 },
  // The price first on phones.
  side: { display: "flex", flexDirection: "column", gap: 2, position: { md: "sticky" }, top: { md: 96 }, order: { xs: -1, md: 0 } },
  alert: { borderRadius: 2 },
  next: { fontSize: "0.8125rem", color: "text.secondary", textAlign: "center" },
  skeleton: { borderRadius: 3 },
  message: { py: 10, textAlign: "center", maxWidth: "sm" },
  messageTitle: { fontSize: "1.5rem", fontWeight: 800, mb: 1 },
  messageText: { color: "text.secondary", mb: 3 },
};
