import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import AddRounded from "@mui/icons-material/AddRounded";
import RemoveRounded from "@mui/icons-material/RemoveRounded";
import { styles } from "./CounterRow.styles";

interface CounterRowProps {
  label: string;
  hint?: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
}

// One "− 2 +" row: a label, an optional hint, and minus/plus buttons.
export default function CounterRow({ label, hint, value, min, max, onChange }: CounterRowProps) {
  return (
    <Box sx={styles.root}>
      <Box>
        <Typography sx={styles.label}>{label}</Typography>
        {hint && <Typography sx={styles.hint}>{hint}</Typography>}
      </Box>
      <Box sx={styles.controls}>
        <IconButton
          size="small"
          onClick={() => onChange(value - 1)}
          disabled={value <= min}
          aria-label={`Fewer ${label.toLowerCase()}`}
          sx={styles.button}
        >
          <RemoveRounded fontSize="small" />
        </IconButton>
        <Typography sx={styles.value} aria-live="polite" aria-label={`${value} ${label.toLowerCase()}`}>
          {value}
        </Typography>
        <IconButton
          size="small"
          onClick={() => onChange(value + 1)}
          disabled={value >= max}
          aria-label={`More ${label.toLowerCase()}`}
          sx={styles.button}
        >
          <AddRounded fontSize="small" />
        </IconButton>
      </Box>
    </Box>
  );
}
