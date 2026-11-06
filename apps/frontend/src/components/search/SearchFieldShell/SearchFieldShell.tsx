import type { ReactNode } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { styles } from "./SearchFieldShell.styles";

interface SearchFieldShellProps {
  icon: ReactNode;
  // Small caption above the value, e.g. "Leaving from".
  label?: string;
  invalid?: boolean;
  children: ReactNode;
}

// Icon plus one search input. A bordered box on phones; on wider screens the
// fields sit in one row, separated by thin dividers.
export default function SearchFieldShell({ icon, label, invalid = false, children }: SearchFieldShellProps) {
  return (
    <Box sx={styles.root(invalid, Boolean(label))}>
      <Box sx={styles.icon} aria-hidden="true">
        {icon}
      </Box>
      {label ? (
        <Box sx={styles.labelled}>
          <Typography component="span" sx={styles.label} aria-hidden="true">
            {label}
          </Typography>
          {children}
        </Box>
      ) : (
        children
      )}
    </Box>
  );
}
