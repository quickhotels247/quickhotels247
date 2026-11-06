import type { ReactNode } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { styles } from "./AdminPageHeader.styles";

interface AdminPageHeaderProps {
  title: string;
  subtitle?: string;
  // Buttons on the right, e.g. "Add admin".
  actions?: ReactNode;
}

// A console page's title, description and actions.
export default function AdminPageHeader({ title, subtitle, actions }: AdminPageHeaderProps) {
  return (
    <Box sx={styles.root}>
      <Box>
        <Typography component="h1" sx={styles.title}>
          {title}
        </Typography>
        {subtitle && <Typography sx={styles.subtitle}>{subtitle}</Typography>}
      </Box>
      {actions && <Box sx={styles.actions}>{actions}</Box>}
    </Box>
  );
}
