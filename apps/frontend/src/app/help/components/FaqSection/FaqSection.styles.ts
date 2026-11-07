export const styles = {
  root: { scrollMarginTop: 96 },
  title: { fontSize: "1.125rem", fontWeight: 800, mb: 1 },
  item: { border: 1, borderColor: "divider", borderRadius: "12px !important", bgcolor: "background.paper", "&::before": { display: "none" }, "& + &": { mt: 1 } },
  question: { fontWeight: 700, fontSize: "0.9375rem" },
  answer: { fontSize: "0.9375rem", color: "text.secondary", lineHeight: 1.65 },
};
