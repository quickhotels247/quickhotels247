import type { ReactNode } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { styles } from "./ResultsMessage.styles";

interface ResultsMessageProps {
  icon: ReactNode;
  title: string;
  text: string;
  // Buttons, e.g. "Try again" or "Clear filters".
  action?: ReactNode;
  tone?: "info" | "error";
}

// A friendly block in place of results: nothing found, an error, or a hint.
export default function ResultsMessage({ icon, title, text, action, tone = "info" }: ResultsMessageProps) {
  return (
    <Box sx={styles.root} role={tone === "error" ? "alert" : "status"}>
      <Box sx={[styles.icon, tone === "error" && styles.iconError]}>{icon}</Box>
      <Typography component="h2" sx={styles.title}>
        {title}
      </Typography>
      <Typography sx={styles.text}>{text}</Typography>
      {action && <Box sx={styles.action}>{action}</Box>}
    </Box>
  );
}
