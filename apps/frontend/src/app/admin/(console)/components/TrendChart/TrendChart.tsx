import Box from "@mui/material/Box";
import Tooltip from "@mui/material/Tooltip";
import type { AdminDashboard } from "@quickhotels/types/admin";
import { formatPrice } from "@/lib/format";
import { styles } from "./TrendChart.styles";

const day = (iso: string) => new Date(`${iso}T00:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "short" });

// Paid bookings per day; hover a bar for the count and value.
export default function TrendChart({ trend }: { trend: AdminDashboard["trend"] }) {
  const max = Math.max(1, ...trend.map((point) => point.bookings));
  return (
    <Box>
      <Box sx={styles.chart} role="img" aria-label={`Paid bookings per day, ${trend.length} days`}>
        {trend.map((point) => (
          <Tooltip key={point.date} title={`${day(point.date)}: ${point.bookings} paid · ${formatPrice({ amount: point.value, currency: "INR" })}`} placement="top">
            <Box sx={styles.column}>
              {point.bookings ? <Box sx={[styles.bar, { height: `${(point.bookings / max) * 100}%` }]} /> : <Box sx={styles.empty} />}
            </Box>
          </Tooltip>
        ))}
      </Box>
      {trend.length > 0 && (
        <Box sx={styles.axis}>
          <span>{day(trend[0]!.date)}</span>
          <span>{day(trend[trend.length - 1]!.date)}</span>
        </Box>
      )}
    </Box>
  );
}
