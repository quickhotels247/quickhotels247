export const styles = {
  page: { py: { xs: 2, md: 3 }, display: "flex", flexDirection: "column", gap: 2.5 },
  crumbs: { fontSize: "0.875rem" },
  crumbCurrent: { fontSize: "0.875rem", color: "text.primary", maxWidth: { xs: 160, sm: "none" }, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  galleryLoading: { mt: 2, borderRadius: 3 },
  section: { scrollMarginTop: { xs: 160, md: 136 }, pt: 1 },
  title: { fontSize: { xs: "1.25rem", md: "1.45rem" }, fontWeight: 800, mb: 2 },
  stayBar: { mb: 2 },
  missing: { py: 10, textAlign: "center" },
  missingTitle: { fontSize: "1.6rem", fontWeight: 800, mb: 1 },
  missingText: { color: "text.secondary", mb: 3 },
};
