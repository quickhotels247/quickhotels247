import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import Typography from "@mui/material/Typography";
import type { AppliedCoupon } from "@quickhotels/types/coupons";
import type { Money, RoomOption } from "@quickhotels/types/hotels";
import { formatPrice } from "@/lib/format";
import { styles } from "./PriceBreakdown.styles";

interface PriceBreakdownProps {
  room: RoomOption;
  nights: number;
  rooms: number;
  coupon: AppliedCoupon | null;
  payable: Money;
}

// Itemised price (spec §4.4): room price before GST, the GST amount, the
// supplier's service fee and its tax as separate lines (TripJack's rule), any
// discount, and the total.
export default function PriceBreakdown({ room, nights, rooms, coupon, payable }: PriceBreakdownProps) {
  const { priceBreakup: p, totalPrice } = room;
  const money = (amount: number) => formatPrice({ amount, currency: totalPrice.currency });
  const lines: [string, number][] = [
    [`Room price · ${rooms > 1 ? `${rooms} rooms × ` : ""}${nights} night${nights === 1 ? "" : "s"}`, p.base],
    ["GST", p.taxes],
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
      {p.promotion ? (
        <Box sx={styles.row}>
          <Typography component="dt" sx={styles.label}>
            {room.promotion?.name ?? "Promotion"}
          </Typography>
          <Typography component="dd" sx={[styles.value, styles.discount]}>
            −{money(p.promotion)}
          </Typography>
        </Box>
      ) : null}
      {coupon && (
        <Box sx={styles.row}>
          <Typography component="dt" sx={styles.label}>
            Coupon {coupon.code}
          </Typography>
          <Typography component="dd" sx={[styles.value, styles.discount]}>
            −{formatPrice(coupon.discount)}
          </Typography>
        </Box>
      )}
      <Divider sx={styles.divider} />
      <Box sx={styles.row}>
        <Typography component="dt" sx={styles.totalLabel}>
          Total to pay
        </Typography>
        <Typography component="dd" sx={styles.total}>
          {formatPrice(payable)}
        </Typography>
      </Box>
      <Typography sx={styles.note}>
        Includes GST{p.gstWorkedOut ? " (worked out at the hotel GST rate: 5% up to ₹7,500 a room-night, 18% above)" : ""}. Charges paid at the hotel, if any, are listed below.
      </Typography>
    </Box>
  );
}
