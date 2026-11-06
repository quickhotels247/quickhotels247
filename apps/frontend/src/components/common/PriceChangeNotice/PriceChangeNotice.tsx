import Alert from "@mui/material/Alert";
import AlertTitle from "@mui/material/AlertTitle";
import Box from "@mui/material/Box";
import type { Money } from "@quickhotels/types/hotels";
import { formatPrice } from "@/lib/format";
import { styles } from "./PriceChangeNotice.styles";

interface PriceChangeNoticeProps {
  change: { previous: Money; current: Money };
}

// The hotel changed the price since the hotel page: old and new, plainly.
export default function PriceChangeNotice({ change }: PriceChangeNoticeProps) {
  const up = change.current.amount > change.previous.amount;
  return (
    <Alert severity={up ? "warning" : "success"} sx={styles.root}>
      <AlertTitle>{up ? "The price went up" : "Good news: the price went down"}</AlertTitle>
      The hotel just updated this rate from{" "}
      <Box component="span" sx={styles.old}>
        {formatPrice(change.previous)}
      </Box>{" "}
      to <strong>{formatPrice(change.current)}</strong> for your stay. {up ? "Please confirm the new price below to continue." : ""}
    </Alert>
  );
}
