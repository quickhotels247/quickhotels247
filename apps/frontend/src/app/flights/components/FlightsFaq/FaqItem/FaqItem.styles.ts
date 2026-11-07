export const styles = {
  root: {
    bgcolor: "transparent",
    "&::before": { display: "none" },
    "&:not(:last-of-type)": { borderBottom: "1px solid", borderColor: "divider" },
  },
  summary: { px: 0, minHeight: 60, "& .MuiAccordionSummary-content": { my: 1.5 } },
  question: { fontWeight: 700, fontSize: { xs: "0.9375rem", md: "1rem" } },
  details: { px: 0, pt: 0, pb: 2 },
  answer: { fontSize: "0.9375rem", color: "text.secondary", lineHeight: 1.6 },
};
