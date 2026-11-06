"use client";

import { useState } from "react";
import Button from "@mui/material/Button";
import ListItemText from "@mui/material/ListItemText";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import GroupOutlined from "@mui/icons-material/GroupOutlined";
import type { SavedTraveller } from "@quickhotels/types/travellers";
import { travellerKey } from "@/lib/hooks/useSavedTravellers";
import { styles } from "./SavedTravellerPicker.styles";

interface SavedTravellerPickerProps {
  travellers: SavedTraveller[];
  // Names already used by other people on this form ("first last", lower case).
  taken: Set<string>;
  onPick: (traveller: SavedTraveller) => void;
  // For the button's accessible name, e.g. "Adult 1".
  label: string;
}

const detail = (traveller: SavedTraveller) =>
  [traveller.dateOfBirth && `Born ${traveller.dateOfBirth}`, traveller.passportNumber && `Passport •••• ${traveller.passportNumber.slice(-4)}`]
    .filter(Boolean)
    .join(" · ");

// "Fill from saved" on a guest or traveller: copies a saved traveller into it.
// Shows nothing when the customer has none saved.
export default function SavedTravellerPicker({ travellers, taken, onPick, label }: SavedTravellerPickerProps) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  if (!travellers.length) return null;
  return (
    <>
      <Button
        size="small"
        startIcon={<GroupOutlined fontSize="small" />}
        onClick={(event) => setAnchor(event.currentTarget)}
        aria-label={`Fill ${label} from saved travellers`}
        aria-haspopup="menu"
        sx={styles.button}
      >
        Fill from saved
      </Button>
      <Menu anchorEl={anchor} open={Boolean(anchor)} onClose={() => setAnchor(null)} slotProps={{ paper: { sx: styles.menu } }}>
        {travellers.map((traveller) => {
          const used = taken.has(travellerKey(traveller.firstName, traveller.lastName));
          return (
            <MenuItem
              key={traveller.id}
              disabled={used}
              onClick={() => {
                onPick(traveller);
                setAnchor(null);
              }}
            >
              <ListItemText
                primary={`${traveller.title} ${traveller.firstName} ${traveller.lastName}`}
                secondary={used ? "Already added" : detail(traveller) || undefined}
              />
            </MenuItem>
          );
        })}
      </Menu>
    </>
  );
}
