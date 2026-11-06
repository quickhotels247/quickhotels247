import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import StarRounded from "@mui/icons-material/StarRounded";
import { formatCount } from "@/lib/format";
import { styles } from "./RatingSummary.styles";

interface RatingSummaryProps {
  rating: number | null;
  reviewCount: number | null;
}

// "★ 4.8 (12K reviews)". Renders nothing when the supplier gave no rating.
export default function RatingSummary({ rating, reviewCount }: RatingSummaryProps) {
  if (rating === null) return null;
  return (
    <Box sx={styles.root}>
      <StarRounded sx={styles.star} aria-hidden="true" />
      <Typography component="span" sx={styles.rating}>
        {rating.toFixed(1)}
        <Box component="span" sx={styles.visuallyHidden}> out of 5</Box>
      </Typography>
      {reviewCount !== null && (
        <Typography component="span" sx={styles.reviews}>
          ({formatCount(reviewCount, { compact: true })} reviews)
        </Typography>
      )}
    </Box>
  );
}
