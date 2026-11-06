import Box from "@mui/material/Box";
import { styles } from "./AirlineBadge.styles";

// Brand-neutral airline mark: its IATA code on a colour picked from the code,
// so each airline looks the same everywhere without using its logo.
const PALETTE = ["#1a56db", "#0e9f6e", "#c27803", "#9061f9", "#e02424", "#0694a2", "#d61f69", "#3f83f8"];

export default function AirlineBadge({ code, name }: { code: string; name: string }) {
  const color = PALETTE[[...code].reduce((sum, char) => sum + char.charCodeAt(0), 0) % PALETTE.length];
  return (
    <Box sx={[styles.root, { bgcolor: color }]} role="img" aria-label={name} title={name}>
      {code}
    </Box>
  );
}
