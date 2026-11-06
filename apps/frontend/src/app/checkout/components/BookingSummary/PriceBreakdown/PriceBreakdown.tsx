import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import Typography from "@mui/material/Typography";
import type { RoomOption } from "@quickhotels/types/hotels";
import { formatPrice } from "@/lib/format";
import { styles } from "./PriceBreakdown.styles";

interface PriceBreakdownProps {
  room: RoomOption;
  nights: number;
  rooms: number;
}

// Itemised price (spec §4.4): room, taxes, the supplier's service fee and its
// tax as separate lines (TripJack's rule), any discount, and the total.
export default function PriceBreakdown({ room, nights, rooms }: PriceBreakdownProps) {
  const { priceBreakup: p, totalPrice } = room;
  const money = (amount: number) => formatPrice({ amount, currency: totalPrice.currency });
  const lines: [string, number][] = [
    [`${rooms > 1 ? `${rooms} rooms × ` : ""}${nights} night${nights === 1 ? "" : "s"}`, p.base],
    ["Taxes", p.taxes],
    ["Service fee", p.managementFee],
    ["Tax on service fee", p.managementFeeTax],
  ];
  return (
    <Box component="dl" sx={styles.root}>
      {lines
        .filter(([, amount], i) => i === 0 || amount > 0)
        .map(([label, amount]) => (
          <Box key={label} sx={styles.row}>
            <Typography component="dt" sx={styles.label}>
              {label}
            </Typography>
            <Typography component="dd" sx={styles.value}>
              {money(amount)}
            </Typography>
          </Box>
        ))}
      {p.discount > 0 && (
        <Box sx={styles.row}>
          <Typography component="dt" sx={styles.label}>
            Discount
          </Typography>
          <Typography component="dd" sx={[styles.value, styles.discount]}>
            −{money(p.discount)}
          </Typography>
        </Box>
      )}
      <Divider sx={styles.divider} />
      <Box sx={styles.row}>
        <Typography component="dt" sx={styles.totalLabel}>
          Total to pay
        </Typography>
        <Typography component="dd" sx={styles.total}>
          {formatPrice(totalPrice)}
        </Typography>
      </Box>
      <Typography sx={styles.note}>Includes taxes and fees. Charges paid at the hotel, if any, are listed below.</Typography>
    </Box>
  );
}
