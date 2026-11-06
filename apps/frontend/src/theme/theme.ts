import { createTheme } from "@mui/material/styles";

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
  typography: {
    fontFamily: "var(--font-inter), system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
    h1: { fontWeight: 800, letterSpacing: "-0.02em" },
    h2: { fontWeight: 700, letterSpacing: "-0.01em" },
    h3: { fontWeight: 700 },
    button: { fontWeight: 600, textTransform: "none" },
  },
  components: {
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
