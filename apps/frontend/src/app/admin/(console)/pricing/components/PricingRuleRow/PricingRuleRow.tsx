import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import DeleteOutlineRounded from "@mui/icons-material/DeleteOutlineRounded";
import EditOutlined from "@mui/icons-material/EditOutlined";
import type { PricingRule } from "@quickhotels/types/pricing";
import { dateText, markupText, scopeText } from "../../utils/ruleText";
import { styles } from "./PricingRuleRow.styles";

const STATUS = { ACTIVE: { label: "Active", color: "success" }, DRAFT: { label: "Draft", color: "default" }, INACTIVE: { label: "Off", color: "default" } } as const;

interface PricingRuleRowProps {
  rule: PricingRule;
  onEdit: () => void;
  onDelete: () => void;
}

export default function PricingRuleRow({ rule, onEdit, onDelete }: PricingRuleRowProps) {
  const status = STATUS[rule.status];
  return (
    <Box sx={[styles.root, rule.status !== "ACTIVE" && styles.muted]}>
      <Box sx={styles.main}>
        <Typography sx={styles.name}>
          {rule.name}
          <Chip label={status.label} color={status.color} size="small" variant="outlined" sx={styles.chip} />
        </Typography>
        <Typography sx={styles.meta}>
          {scopeText(rule)} · {dateText(rule)} · priority {rule.priority} · v{rule.version}
        </Typography>
      </Box>
      <Typography sx={styles.markup}>{markupText(rule)}</Typography>
      <Box sx={styles.actions}>
        <Tooltip title="Edit">
          <IconButton aria-label={`Edit ${rule.name}`} onClick={onEdit}>
            <EditOutlined fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Delete">
          <IconButton aria-label={`Delete ${rule.name}`} onClick={onDelete}>
            <DeleteOutlineRounded fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  );
}
