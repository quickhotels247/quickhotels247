import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import Typography from "@mui/material/Typography";
import type { BookingDetails, BookingPaymentStatus } from "@quickhotels/types/bookings";
import { formatPrice } from "@/lib/format";
import { styles } from "./PriceCard.styles";

const PAYMENT_LABEL: Record<BookingPaymentStatus, string> = {
  pending: "Payment pending",
  paid: "Paid",
  failed: "Payment failed",
  refunded: "Refunded",
  partially_refunded: "Partly refunded",
};

// What the booking cost and where the payment stands.
export default function PriceCard({ booking }: { booking: BookingDetails }) {
  const { price, payment } = booking;
  return (
    <Box component="section" aria-labelledby="price-title" sx={styles.root}>
      <Typography component="h2" id="price-title" sx={styles.title}>
        Payment summary
      </Typography>
      {price.taxes.amount > 0 && (
        <Box sx={styles.row}>
          <Typography sx={styles.label}>Taxes and fees</Typography>
          <Typography sx={styles.value}>{formatPrice(price.taxes)}</Typography>
        </Box>
      )}
      {price.discount.amount > 0 && (
        <Box sx={styles.row}>
          <Typography sx={styles.label}>Discount</Typography>
          <Typography sx={[styles.value, styles.discount]}>−{formatPrice(price.discount)}</Typography>
        </Box>
      )}
      <Box sx={styles.row}>
        <Typography sx={styles.totalLabel}>Total</Typography>
        <Typography sx={styles.total}>{formatPrice(price.total)}</Typography>
      </Box>
      <Divider />
      <Box sx={styles.row}>
        <Typography sx={styles.label}>Payment</Typography>
        <Typography sx={styles.value}>
          {payment ? `${PAYMENT_LABEL[payment.status]}${payment.method ? ` · ${payment.method}` : ""}` : "Not paid yet"}
        </Typography>
      </Box>
    </Box>
  );
}
