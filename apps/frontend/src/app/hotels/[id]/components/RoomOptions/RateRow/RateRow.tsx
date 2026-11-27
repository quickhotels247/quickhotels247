import Link from "next/link";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import CheckRounded from "@mui/icons-material/CheckRounded";
import FreeBreakfastOutlined from "@mui/icons-material/FreeBreakfastOutlined";
import InfoOutlined from "@mui/icons-material/InfoOutlined";
import NoMealsOutlined from "@mui/icons-material/NoMealsOutlined";
import type { RoomOption } from "@quickhotels/types/hotels";
import { formatClock, formatShortDate } from "@/lib/dates";
import { formatPrice } from "@/lib/format";
import { roomPriceParts } from "@/lib/priceParts";
import { styles } from "./RateRow.styles";

interface RateRowProps {
  option: RoomOption;
  // "2 nights, 2 adults"
  stayLabel: string;
  reserveHref: string | null;
}

// "2099-05-18T23:59:59" (India time) → "18 May, 11:59 PM".
function deadline(iso: string) {
  const [day, clock = "00:00"] = iso.split("T");
  return `${formatShortDate(day!)}, ${formatClock(clock)}`;
}

// One rate for a room: what's included, the cancellation terms, the price
// for the whole stay, and "Reserve".
export default function RateRow({ option, stayLabel, reserveHref }: RateRowProps) {
  const { priceBreakup: p, totalPrice } = option;
  const parts = roomPriceParts(option);
  const money = (amount: number) => formatPrice({ amount, currency: totalPrice.currency });
  const breakup = [
    `Room price (excl. GST): ${money(p.base)}`,
    p.taxes ? `GST: ${money(p.taxes)}` : null,
    p.managementFee ? `Service fee: ${money(p.managementFee)}` : null,
    p.managementFeeTax ? `Tax on service fee: ${money(p.managementFeeTax)}` : null,
    p.discount ? `Discount: −${money(p.discount)}` : null,
    p.promotion ? `${option.promotion?.name ?? "Promotion"}: −${money(p.promotion)}` : null,
  ].filter(Boolean);

  return (
    <Box sx={styles.root}>
      <Box sx={styles.terms}>
        <Typography sx={[styles.term, option.mealPlan ? styles.good : styles.plain]}>
          {option.mealPlan ? <FreeBreakfastOutlined sx={styles.icon} /> : <NoMealsOutlined sx={styles.icon} />}
          {option.mealPlan ? (option.mealPlan === "Breakfast" ? "Breakfast included" : option.mealPlan) : "Room only"}
        </Typography>
        {option.freeCancellation ? (
          <Typography sx={[styles.term, styles.good]}>
            <CheckRounded sx={styles.icon} />
            Free cancellation{option.freeCancellationUntil ? ` before ${deadline(option.freeCancellationUntil)}` : ""}
          </Typography>
        ) : (
          <Typography sx={[styles.term, styles.plain]}>Non-refundable</Typography>
        )}
        {option.inclusions.map((inclusion) => (
          <Typography key={inclusion} sx={[styles.term, styles.good]}>
            <CheckRounded sx={styles.icon} />
            {inclusion}
          </Typography>
        ))}
        {option.notes && <Typography sx={styles.notes}>{option.notes}</Typography>}
        {(option.panRequired || option.passportRequired) && (
          <Typography sx={styles.notes}>
            {option.passportRequired ? "Passport details needed at booking." : "An Indian PAN card is needed at booking."}
          </Typography>
        )}
      </Box>
      <Box sx={styles.price}>
        <Typography sx={styles.stay}>{stayLabel}</Typography>
        {option.strikethroughPrice && (
          <Typography component="div" sx={styles.was}>
            {option.promotion && <Box component="span" sx={styles.off}>{option.promotion.percentOff}% off</Box>}
            <Box component="span" sx={styles.strike}>{money(parts.was ?? option.strikethroughPrice.amount)}</Box>
          </Typography>
        )}
        <Typography sx={styles.total}>
          {money(parts.price)}
          <Tooltip title={<Box sx={styles.breakup}>{breakup.map((line) => <div key={line}>{line}</div>)}</Box>}>
            <InfoOutlined sx={styles.info} aria-label={`Price details: ${breakup.join(", ")}`} />
          </Tooltip>
        </Typography>
        <Typography sx={styles.taxes}>{parts.taxes > 0 ? `+${money(parts.taxes)} taxes and fees` : "Includes taxes and fees"}</Typography>
        {reserveHref ? (
          <Button component={Link} href={reserveHref} variant="contained" sx={styles.reserve}>
            Reserve
          </Button>
        ) : (
          <Button variant="contained" disabled sx={styles.reserve}>
            Reserve
          </Button>
        )}
      </Box>
    </Box>
  );
}
