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

// Itemised price (spec §4.4), as large booking sites show it: the price, then
// "+ taxes and fees" (GST, and the supplier's service fee and its tax as their
// own lines, TripJack's rule), any discounts, and the total.
export default function PriceBreakdown({ room, nights, rooms, coupon, payable }: PriceBreakdownProps) {
  const { priceBreakup: p, totalPrice } = room;
  const money = (amount: number) => formatPrice({ amount, currency: totalPrice.currency });
  const taxesAndFees = p.taxes + p.managementFee + p.managementFeeTax;
  // GST is inside "Taxes and fees". TripJack's rule: its service fee and the
  // tax on it are shown as their own lines; amounts that round to ₹0 are left
  // out (they're still in the total).
  const parts: [string, number][] = (
    [
      ["Service fee", p.managementFee],
      ["Tax on service fee", p.managementFeeTax],
    ] as [string, number][]
  ).filter(([, amount]) => amount >= 0.5);
  return (
    <Box component="dl" sx={styles.root}>
      <Box sx={styles.row}>
        <Typography component="dt" sx={styles.label}>
          Price · {rooms > 1 ? `${rooms} rooms × ` : ""}
          {nights} night{nights === 1 ? "" : "s"}
        </Typography>
        <Typography component="dd" sx={styles.value}>
          {money(p.base)}
        </Typography>
      </Box>
      {taxesAndFees > 0 && (
        <>
          <Box sx={styles.row}>
            <Typography component="dt" sx={styles.label}>
              + Taxes and fees
            </Typography>
            <Typography component="dd" sx={styles.value}>
              {money(taxesAndFees)}
            </Typography>
          </Box>
          {parts.map(([label, amount]) => (
            <Box key={label} sx={[styles.row, styles.sub]}>
              <Typography component="dt" sx={styles.subLabel}>
                {label}
              </Typography>
              <Typography component="dd" sx={styles.subValue}>
                {money(amount)}
              </Typography>
            </Box>
          ))}
        </>
      )}
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
    </Box>
  );
}
