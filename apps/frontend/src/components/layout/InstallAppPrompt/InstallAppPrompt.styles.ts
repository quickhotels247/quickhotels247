export const styles = {
  sheet: { borderTopLeftRadius: 20, borderTopRightRadius: 20, px: 2.5, pt: 3, pb: "calc(20px + env(safe-area-inset-bottom))" },
  close: { position: "absolute", top: 8, right: 8 },
  head: { display: "flex", gap: 2, alignItems: "center", pr: 4 },
  icon: { width: 56, height: 56, borderRadius: 3, flexShrink: 0, boxShadow: 1 },
  title: { fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: "1.05rem", lineHeight: 1.3 },
  text: { fontSize: "0.875rem", color: "text.secondary", mt: 0.5 },
  steps: { m: 0, mt: 2.5, pl: 2.5, display: "grid", gap: 1.25, fontSize: "0.9375rem", "& strong": { fontWeight: 700 } },
  inlineIcon: { fontSize: "1.15rem", verticalAlign: "-3px", color: "primary.main", mx: 0.25 },
  actions: { display: "flex", gap: 1.5, mt: 3 },
  later: { flex: 1, borderRadius: 2, textTransform: "none", fontWeight: 600 },
  install: { flex: 2, borderRadius: 2, textTransform: "none", fontWeight: 700, py: 1.25 },
};
