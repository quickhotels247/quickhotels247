import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import DeleteOutlineRounded from "@mui/icons-material/DeleteOutlineRounded";
import EditOutlined from "@mui/icons-material/EditOutlined";
import type { Promotion } from "@quickhotels/types/pricing";
import { formatPrice } from "@/lib/format";
import { styles } from "./PromotionRow.styles";

const inr = (amount: number) => formatPrice({ amount, currency: "INR" });
const day = (iso: string) => new Date(`${iso}T00:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

export const promotionText = (promotion: Pick<Promotion, "discountType" | "value" | "maxDiscount">) =>
  promotion.discountType === "FIXED" ? `${inr(promotion.value)} off` : `${promotion.value}% off${promotion.maxDiscount ? ` (max ${inr(promotion.maxDiscount)})` : ""}`;

const datesText = (promotion: Promotion) =>
  promotion.validFrom || promotion.validTo
    ? `${promotion.validFrom ? day(promotion.validFrom) : "Now"} – ${promotion.validTo ? day(promotion.validTo) : "no end"}`
    : "Always";

export default function PromotionRow({ promotion, onEdit, onDelete }: { promotion: Promotion; onEdit: () => void; onDelete: () => void }) {
  const status = promotion.live
    ? { label: "Running now", color: "success" as const }
    : promotion.status === "ACTIVE"
      ? { label: "Active · not running", color: "warning" as const }
      : { label: promotion.status === "DRAFT" ? "Draft" : "Off", color: "default" as const };
  return (
    <Box sx={[styles.root, !promotion.live && styles.muted]}>
      <Box sx={styles.main}>
        <Typography component="div" sx={styles.name}>
          {promotion.name}
          <Chip label={status.label} color={status.color} size="small" variant="outlined" sx={styles.chip} />
        </Typography>
        <Typography sx={styles.meta}>
          All hotels · {datesText(promotion)} · v{promotion.version}
        </Typography>
      </Box>
      <Typography sx={styles.amount}>{promotionText(promotion)}</Typography>
      <Box sx={styles.actions}>
        <Tooltip title="Edit">
          <IconButton aria-label={`Edit ${promotion.name}`} onClick={onEdit}>
            <EditOutlined fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Delete">
          <IconButton aria-label={`Delete ${promotion.name}`} onClick={onDelete}>
            <DeleteOutlineRounded fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  );
}
