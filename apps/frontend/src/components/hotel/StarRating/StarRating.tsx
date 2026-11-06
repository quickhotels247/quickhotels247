import Box from "@mui/material/Box";
import StarRounded from "@mui/icons-material/StarRounded";
import { styles } from "./StarRating.styles";

interface StarRatingProps {
  // Official star category (1–5). Nothing is shown when unknown.
  stars: number | null;
}

// "★★★★☆ 4-star hotel": the property's category, not a guest review score.
export default function StarRating({ stars }: StarRatingProps) {
  if (!stars) return null;
  const whole = Math.round(stars);
  return (
    <Box sx={styles.root} role="img" aria-label={`${whole}-star hotel`}>
      {Array.from({ length: whole }, (_, i) => (
        <StarRounded key={i} sx={styles.star} aria-hidden="true" />
      ))}
    </Box>
  );
}
