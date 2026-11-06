import Box from "@mui/material/Box";
import Skeleton from "@mui/material/Skeleton";
import Typography from "@mui/material/Typography";
import { styles } from "./FlightResultsSkeleton.styles";

// Placeholder flight cards while fares load; airlines take a few seconds.
export default function FlightResultsSkeleton({ message }: { message?: string }) {
  return (
    <Box sx={styles.root} aria-busy="true">
      {message && (
        <Typography role="status" sx={styles.message}>
          {message}
        </Typography>
      )}
      {[0, 1, 2, 3].map((i) => (
        <Box key={i} sx={styles.card}>
          <Box sx={styles.row}>
            <Skeleton variant="rounded" width={36} height={36} />
            <Skeleton width="20%" />
            <Skeleton width="40%" />
            <Skeleton width="15%" />
          </Box>
          <Box sx={styles.price}>
            <Skeleton width={90} height={32} />
            <Skeleton variant="rounded" width={120} height={36} />
          </Box>
        </Box>
      ))}
    </Box>
  );
}
