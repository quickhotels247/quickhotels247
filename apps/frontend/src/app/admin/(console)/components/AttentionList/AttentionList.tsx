import Link from "next/link";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Typography from "@mui/material/Typography";
import type { DashboardAttentionItem } from "@quickhotels/types/admin";
import { formatPrice } from "@/lib/format";
import { styles } from "./AttentionList.styles";

const KIND: Record<DashboardAttentionItem["kind"], { label: string; tone: "warning" | "error" | "info" }> = {
  awaiting_confirmation: { label: "Paid · not confirmed", tone: "warning" },
  cancellation_pending: { label: "Cancellation with supplier", tone: "warning" },
  refund_pending: { label: "Refund pending", tone: "info" },
  refund_failed: { label: "Refund failed", tone: "error" },
  manual_review: { label: "Needs review", tone: "error" },
};

// "12 min ago", "3 h ago", "2 days ago".
export function ago(iso: string) {
  const minutes = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60_000));
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  return hours < 48 ? `${hours} h ago` : `${Math.round(hours / 24)} days ago`;
}

export const bookingHref = (product: "hotel" | "flight", id: string) => `/admin/bookings/${product === "hotel" ? "hotels" : "flights"}/${id}`;

// What someone should look at now; urgent items first. Each row opens the booking.
export default function AttentionList({ items }: { items: DashboardAttentionItem[] }) {
  if (!items.length) return <Typography sx={styles.empty}>Nothing needs attention. Every paid booking is confirmed or settled.</Typography>;
  return (
    <Box component="ul" sx={styles.list}>
      {items.map((item) => (
        <Box component="li" key={`${item.kind}-${item.bookingId}`}>
          <Box component={Link} href={bookingHref(item.product, item.bookingId)} sx={styles.row}>
            <Box sx={styles.main}>
              <Typography component="div" sx={styles.title}>
                <Chip size="small" variant="outlined" color={KIND[item.kind].tone} label={KIND[item.kind].label} sx={styles.chip} />
                <span className="ref">{item.reference}</span>
                <span>· {item.product === "hotel" ? "Hotel" : "Flight"}</span>
              </Typography>
              <Typography sx={styles.meta}>{[item.title, item.detail].filter(Boolean).join(" · ")}</Typography>
            </Box>
            <Box sx={styles.side}>
              {item.amount !== null && <Typography sx={styles.amount}>{formatPrice({ amount: item.amount, currency: "INR" })}</Typography>}
              <Typography sx={[styles.time, item.urgent && styles.urgent]}>{ago(item.since)}</Typography>
            </Box>
          </Box>
        </Box>
      ))}
    </Box>
  );
}
