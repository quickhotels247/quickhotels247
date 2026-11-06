import Box from "@mui/material/Box";
import Skeleton from "@mui/material/Skeleton";
import Typography from "@mui/material/Typography";
import { styles } from "./ResultsSkeleton.styles";

interface ResultsSkeletonProps {
  // Shown above the placeholders while a new search runs.
  message?: string;
  count?: number;
}

// Placeholder cards shaped like HotelResultCard while hotels are priced.
export default function ResultsSkeleton({ message, count = 4 }: ResultsSkeletonProps) {
  return (
    <Box sx={styles.root} aria-busy="true">
      {message && (
        <Typography sx={styles.message} role="status">
          {message}
        </Typography>
      )}
      {Array.from({ length: count }, (_, i) => (
        <Box key={i} sx={styles.card}>
          <Skeleton variant="rounded" sx={styles.media} />
          <Box sx={styles.body}>
            <Skeleton width="70%" height={28} />
            <Skeleton width="35%" />
            <Skeleton width="55%" />
            <Skeleton width="40%" sx={styles.last} />
          </Box>
          <Box sx={styles.pricing}>
            <Skeleton width={120} />
            <Skeleton width={100} height={36} />
            <Skeleton variant="rounded" width={150} height={36} />
          </Box>
        </Box>
      ))}
    </Box>
  );
}
