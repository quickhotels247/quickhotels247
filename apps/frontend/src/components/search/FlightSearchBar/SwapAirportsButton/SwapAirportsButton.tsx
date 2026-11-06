import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import SwapHorizRounded from "@mui/icons-material/SwapHorizRounded";
import { styles } from "./SwapAirportsButton.styles";

interface SwapAirportsButtonProps {
  onSwap: () => void;
}

// ⇄ between From and To. Turns sideways-to-vertical when the fields stack.
export default function SwapAirportsButton({ onSwap }: SwapAirportsButtonProps) {
  return (
    <Box sx={styles.root}>
      <IconButton onClick={onSwap} aria-label="Swap departure and arrival airports" sx={styles.button}>
        <SwapHorizRounded />
      </IconButton>
    </Box>
  );
}
