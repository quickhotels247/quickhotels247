export const styles = {
  outer: { px: { xs: 0, sm: 2, md: 3 }, pt: { xs: 0, sm: 2, md: 3 } },
  root: {
    position: "relative",
    overflow: "hidden",
    borderRadius: { xs: 0, sm: 4 },
    minHeight: { xs: 640, sm: 520, md: 480 },
    display: "flex",
    alignItems: "flex-end",
    bgcolor: "#1e3a8a",
  },
  shade: {
    position: "absolute",
    inset: 0,
    background: "linear-gradient(180deg, rgba(15,23,42,0.1) 0%, rgba(15,23,42,0.35) 45%, rgba(15,23,42,0.8) 100%)",
  },
  content: { position: "relative", width: "100%", px: { xs: 2, sm: 4, md: 6 }, pb: { xs: 2.5, sm: 4, md: 5 }, pt: { xs: 10, md: 12 } },
  title: {
    color: "common.white",
    fontSize: { xs: "2rem", sm: "2.6rem", md: "3.1rem" },
    lineHeight: 1.1,
    maxWidth: 720,
    textShadow: "0 2px 18px rgba(0,0,0,0.35)",
  },
  subtitle: { mt: 1.5, color: "rgba(255,255,255,0.92)", fontSize: { xs: "1rem", md: "1.15rem" } },
  search: { mt: { xs: 3, md: 4 } },
};
