import Box from "@mui/material/Box";
import Skeleton from "@mui/material/Skeleton";
import { styles } from "./CardSkeletonRow.styles";

interface CardSkeletonRowProps {
  label: string;
  count?: number;
  // Photo height as a CSS aspect ratio, e.g. "4 / 3".
  aspectRatio?: string;
}

// Grey placeholder cards while a section's data loads, keeping the layout steady.
export default function CardSkeletonRow({ label, count = 4, aspectRatio = "4 / 3" }: CardSkeletonRowProps) {
  return (
    <Box sx={styles.row} role="status" aria-label={label}>
      {Array.from({ length: count }, (_, i) => (
        <Box key={i} sx={styles.card(i)}>
          <Skeleton variant="rounded" sx={{ ...styles.photo, aspectRatio }} />
          <Skeleton width="70%" />
          <Skeleton width="45%" />
        </Box>
      ))}
    </Box>
  );
}
