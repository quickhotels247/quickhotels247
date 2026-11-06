import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import DeleteOutlineRounded from "@mui/icons-material/DeleteOutlineRounded";
import EditOutlined from "@mui/icons-material/EditOutlined";
import type { SavedTraveller } from "@quickhotels/types/travellers";
import { ageOn } from "../../utils/travellerForm";
import { styles } from "./TravellerRow.styles";

interface TravellerRowProps {
  traveller: SavedTraveller;
  onEdit: () => void;
  onRemove: () => void;
}

const born = (iso: string) => new Date(`${iso}T00:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
// Only the last 4 characters of a passport number are shown.
const masked = (number: string) => `•••• ${number.slice(-4)}`;

export default function TravellerRow({ traveller, onEdit, onRemove }: TravellerRowProps) {
  const name = `${traveller.title} ${traveller.firstName} ${traveller.lastName}`;
  const details = [
    traveller.dateOfBirth && `Born ${born(traveller.dateOfBirth)} (${ageOn(traveller.dateOfBirth)} yrs)`,
    traveller.nationality && new Intl.DisplayNames(["en"], { type: "region" }).of(traveller.nationality),
  ].filter(Boolean);
  const expired = traveller.passportExpiry !== null && traveller.passportExpiry < new Date().toISOString().slice(0, 10);
  return (
    <Box sx={styles.root}>
      <Avatar sx={styles.avatar}>{traveller.firstName.charAt(0).toUpperCase()}</Avatar>
      <Box sx={styles.text}>
        <Typography sx={styles.name}>{name}</Typography>
        {details.length > 0 && <Typography sx={styles.meta}>{details.join(" · ")}</Typography>}
        {traveller.passportNumber && (
          <Box sx={styles.chips}>
            <Chip size="small" variant="outlined" label={`Passport ${masked(traveller.passportNumber)}`} />
            {expired && <Chip size="small" color="error" variant="outlined" label="Passport expired" />}
          </Box>
        )}
      </Box>
      <Box sx={styles.actions}>
        <Tooltip title="Edit">
          <IconButton aria-label={`Edit ${name}`} onClick={onEdit}>
            <EditOutlined fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Remove">
          <IconButton aria-label={`Remove ${name}`} onClick={onRemove}>
            <DeleteOutlineRounded fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  );
}
