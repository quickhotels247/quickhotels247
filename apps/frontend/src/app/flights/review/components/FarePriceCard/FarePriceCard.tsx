import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import Typography from "@mui/material/Typography";
import type { FlightPriceBreakdown } from "@quickhotels/types/flight-checkout";
import { formatPrice } from "@/lib/format";
import { styles } from "./FarePriceCard.styles";

const PAX = { adult: ["adult", "adults"], child: ["child", "children"], infant: ["infant", "infants"] } as const;

// Fare breakdown (base, taxes, service fee and its tax as separate lines),
// what each traveller pays, and the total.
export default function FarePriceCard({ price }: { price: FlightPriceBreakdown }) {
  const lines: [string, number][] = [
    ["Base fare", price.base.amount],
    ["Taxes and airline charges", price.taxes.amount],
    ["Service fee", price.serviceFee.amount],
    ["Tax on service fee", price.serviceFeeTax.amount],
  ];
  const money = (amount: number) => formatPrice({ amount, currency: price.total.currency });
  return (
    <Box component="section" aria-labelledby="price-title" sx={styles.root}>
      <Typography component="h2" id="price-title" sx={styles.heading}>
        Price
      </Typography>
      <Box component="dl" sx={styles.list}>
        {price.perTraveller.map(({ type, count, each }) => (
          <Box key={type} sx={styles.row}>
            <Typography component="dt" sx={styles.label}>
              {count} {PAX[type][count === 1 ? 0 : 1]} × {formatPrice(each)}
            </Typography>
            <Typography component="dd" sx={styles.value}>
              {money(each.amount * count)}
            </Typography>
          </Box>
        ))}
        <Divider sx={styles.divider} />
        {lines
          .filter(([, amount], i) => i < 2 || amount > 0)
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
        <Divider sx={styles.divider} />
        <Box sx={styles.row}>
          <Typography component="dt" sx={styles.totalLabel}>
            Total
          </Typography>
          <Typography component="dd" sx={styles.total}>
            {formatPrice(price.total)}
          </Typography>
        </Box>
      </Box>
      <Typography sx={styles.note}>Includes all taxes and fees. Seats, meals and extra baggage, if added later, cost extra.</Typography>
    </Box>
  );
}
