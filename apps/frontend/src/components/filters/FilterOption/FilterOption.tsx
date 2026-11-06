import type { ReactNode } from "react";
import Box from "@mui/material/Box";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import Typography from "@mui/material/Typography";
import { styles } from "./FilterOption.styles";

interface FilterOptionProps {
  label: ReactNode;
  // Matching hotels among those priced so far, when known.
  count?: number;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

// One checkbox row: "☐ Free cancellation   38".
export default function FilterOption({ label, count, checked, onChange }: FilterOptionProps) {
  return (
    <FormControlLabel
      sx={styles.root}
      control={<Checkbox size="small" checked={checked} onChange={(event) => onChange(event.target.checked)} sx={styles.checkbox} />}
      label={
        <Box sx={styles.label}>
          <Box component="span">{label}</Box>
          {count !== undefined && (
            <Typography component="span" sx={styles.count}>
              {count}
            </Typography>
          )}
        </Box>
      }
    />
  );
}
