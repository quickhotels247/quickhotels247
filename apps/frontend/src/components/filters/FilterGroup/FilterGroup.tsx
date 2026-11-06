import type { ReactNode } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { styles } from "./FilterGroup.styles";

interface FilterGroupProps {
  title: string;
  children: ReactNode;
}

// A titled block of the filter panel ("Star rating", "Your budget"…).
export default function FilterGroup({ title, children }: FilterGroupProps) {
  return (
    <Box component="fieldset" sx={styles.root}>
      <Typography component="legend" sx={styles.title}>
        {title}
      </Typography>
      {children}
    </Box>
  );
}
