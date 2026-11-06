import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { styles } from "./StatCard.styles";

// One headline number on the overview.
export default function StatCard({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <Box sx={styles.root}>
      <Typography sx={styles.label}>{label}</Typography>
      <Typography sx={styles.value}>{value}</Typography>
      {note && <Typography sx={styles.note}>{note}</Typography>}
    </Box>
  );
}
