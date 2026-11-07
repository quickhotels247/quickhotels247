import { createTheme } from "@mui/material/styles";

const BODY_FONT = "var(--font-inter), system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif";
export const HEADING_FONT = "var(--font-heading), var(--font-inter), system-ui, -apple-system, 'Segoe UI', sans-serif";

// Brand colours from the design (docs/dashboard1.png): blue actions, a yellow
// accent from the logo, and slate text on a soft blue-grey background.
export const theme = createTheme({
  palette: {
    primary: { main: "#1a56db", dark: "#1544b0", light: "#e8effd", contrastText: "#ffffff" },
    secondary: { main: "#f5a524", contrastText: "#0f172a" },
    success: { main: "#16a34a" },
    background: { default: "#f5f7fb", paper: "#ffffff" },
    text: { primary: "#0f172a", secondary: "#64748b" },
    divider: "#e2e8f0",
  },
  shape: { borderRadius: 12 },
  // Type: Inter for body text, Plus Jakarta Sans for headings (every h1–h6,
  // including <Typography component="h2"> with sx sizes, via CssBaseline below).
  // Text sizes use one scale: 0.75 · 0.8125 · 0.875 · 0.9375 · 1 · 1.125rem,
  // then heading sizes. Pick from it instead of in-between values.
  typography: {
    fontFamily: BODY_FONT,
    h1: { fontFamily: HEADING_FONT, fontWeight: 800, letterSpacing: "-0.025em" },
    h2: { fontFamily: HEADING_FONT, fontWeight: 800, letterSpacing: "-0.02em" },
    h3: { fontFamily: HEADING_FONT, fontWeight: 700, letterSpacing: "-0.015em" },
    h4: { fontFamily: HEADING_FONT, fontWeight: 700, letterSpacing: "-0.01em" },
    h5: { fontFamily: HEADING_FONT, fontWeight: 700 },
    h6: { fontFamily: HEADING_FONT, fontWeight: 700 },
    button: { fontFamily: HEADING_FONT, fontWeight: 700, textTransform: "none", letterSpacing: "0" },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        // Headings rendered as Typography with a body variant still get the
        // heading font (class + element beats the variant's class).
        "h1.MuiTypography-root, h2.MuiTypography-root, h3.MuiTypography-root, h4.MuiTypography-root, h5.MuiTypography-root, h6.MuiTypography-root, legend.MuiTypography-root":
          { fontFamily: HEADING_FONT },
        body: { WebkitFontSmoothing: "antialiased", MozOsxFontSmoothing: "grayscale", textRendering: "optimizeLegibility" },
      },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: { root: { borderRadius: 10 } },
    },
    MuiCard: {
      defaultProps: { elevation: 0 },
      styleOverrides: { root: { border: "1px solid #e2e8f0" } },
    },
    MuiContainer: { defaultProps: { maxWidth: "lg" } },
  },
});
