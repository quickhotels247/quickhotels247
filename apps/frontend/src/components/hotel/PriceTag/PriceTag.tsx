import Typography from "@mui/material/Typography";
import type { Money } from "@quickhotels/types/hotels";
import { formatPrice } from "@/lib/format";
import { styles } from "./PriceTag.styles";

interface PriceTagProps {
  price: Money;
  // What the price covers, shown after it (spec §4.2: say per night or total).
  unit?: string;
}

// "₹9,999 / night".
export default function PriceTag({ price, unit = "night" }: PriceTagProps) {
  return (
    <Typography component="p" sx={styles.root}>
      <Typography component="span" sx={styles.amount}>
        {formatPrice(price)}
      </Typography>
      <Typography component="span" sx={styles.unit}>
        {" "}/ {unit}
      </Typography>
    </Typography>
  );
}
