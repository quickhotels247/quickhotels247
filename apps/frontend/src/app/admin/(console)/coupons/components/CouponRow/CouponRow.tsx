import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import DeleteOutlineRounded from "@mui/icons-material/DeleteOutlineRounded";
import EditOutlined from "@mui/icons-material/EditOutlined";
import type { Coupon } from "@quickhotels/types/coupons";
import { formatPrice } from "@/lib/format";
import { styles } from "./CouponRow.styles";

const inr = (amount: number) => formatPrice({ amount, currency: "INR" });
const day = (iso: string) => new Date(`${iso}T00:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

export function discountText(coupon: Pick<Coupon, "discountType" | "value" | "maxDiscount">) {
  if (coupon.discountType === "FIXED") return `${inr(coupon.value)} off`;
  return `${coupon.value}% off${coupon.maxDiscount ? ` (max ${inr(coupon.maxDiscount)})` : ""}`;
}

interface CouponRowProps {
  coupon: Coupon;
  onEdit: () => void;
  onDelete: () => void;
}

export default function CouponRow({ coupon, onEdit, onDelete }: CouponRowProps) {
  const today = new Date().toISOString().slice(0, 10);
  const expired = coupon.validTo < today;
  const status = expired ? { label: "Expired", color: "default" as const } : coupon.status === "ACTIVE" ? { label: "Active", color: "success" as const } : { label: coupon.status === "DRAFT" ? "Draft" : "Off", color: "default" as const };
  const scope = [coupon.product === "HOTEL" ? "Hotels" : coupon.product === "FLIGHT" ? "Flights" : "Hotels & flights", coupon.eligibleDestinations.length ? coupon.eligibleDestinations.join(", ") : null, coupon.minBookingAmount ? `min ${inr(coupon.minBookingAmount)}` : null]
    .filter(Boolean)
    .join(" · ");
  return (
    <Box sx={[styles.root, (coupon.status !== "ACTIVE" || expired) && styles.muted]}>
      <Box sx={styles.code}>{coupon.code}</Box>
      <Box sx={styles.main}>
        <Typography sx={styles.title}>
          {discountText(coupon)}
          <Chip label={status.label} color={status.color} size="small" variant="outlined" sx={styles.chip} />
          {coupon.public && <Chip label="On Home" size="small" color="primary" variant="outlined" sx={styles.chip} />}
        </Typography>
        <Typography sx={styles.meta}>
          {scope} · {day(coupon.validFrom)} – {day(coupon.validTo)} · used {coupon.redemptions}
          {coupon.usageLimit ? ` / ${coupon.usageLimit}` : ""}
        </Typography>
      </Box>
      <Box sx={styles.actions}>
        <Tooltip title="Edit">
          <IconButton aria-label={`Edit ${coupon.code}`} onClick={onEdit}>
            <EditOutlined fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Delete">
          <IconButton aria-label={`Delete ${coupon.code}`} onClick={onDelete}>
            <DeleteOutlineRounded fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  );
}
