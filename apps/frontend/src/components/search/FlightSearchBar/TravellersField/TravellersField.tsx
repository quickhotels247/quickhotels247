"use client";

import { useId, useState } from "react";
import Button from "@mui/material/Button";
import ButtonBase from "@mui/material/ButtonBase";
import Divider from "@mui/material/Divider";
import Popover from "@mui/material/Popover";
import PersonOutlineRounded from "@mui/icons-material/PersonOutlineRounded";
import CounterRow from "@/components/common/CounterRow";
import SearchFieldShell from "@/components/search/SearchFieldShell";
import { TRAVELLER_LIMITS } from "../flightSearchCriteria";
import { styles } from "./TravellersField.styles";

interface Travellers {
  adults: number;
  children: number;
  infants: number;
}

interface TravellersFieldProps {
  adults: number;
  // Named childCount because `children` is React's own prop.
  childCount: number;
  infants: number;
  onChange: (travellers: Travellers) => void;
  invalid: boolean;
}

const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? "" : "s"}`;

// "1 Traveller" button opening counters for adults, children and infants.
export default function TravellersField({ adults, childCount, infants, onChange, invalid }: TravellersFieldProps) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const open = anchor !== null;
  const panelId = useId();
  const travellers = { adults, children: childCount, infants };
  const set = (key: keyof Travellers) => (value: number) => onChange({ ...travellers, [key]: value });
  const label = plural(adults + childCount + infants, "Traveller");

  return (
    <SearchFieldShell icon={<PersonOutlineRounded />} label="Travellers" invalid={invalid}>
      <ButtonBase
        onClick={(event) => setAnchor(event.currentTarget)}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        aria-label={`Travellers: ${label}`}
        sx={styles.trigger}
      >
        {label}
      </ButtonBase>
      <Popover
        open={open}
        anchorEl={anchor}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        transformOrigin={{ vertical: "top", horizontal: "left" }}
        slotProps={{ paper: { id: panelId, role: "dialog", "aria-label": "Travellers", sx: styles.paper } }}
      >
        <CounterRow label="Adults" hint="12 years and over" value={adults} {...TRAVELLER_LIMITS.adults} onChange={set("adults")} />
        <Divider />
        <CounterRow label="Children" hint="2–11 years" value={childCount} {...TRAVELLER_LIMITS.children} onChange={set("children")} />
        <Divider />
        <CounterRow
          label="Infants"
          hint="Under 2, on an adult's lap"
          value={infants}
          min={TRAVELLER_LIMITS.infants.min}
          max={Math.min(TRAVELLER_LIMITS.infants.max, adults)}
          onChange={set("infants")}
        />
        <Button variant="contained" fullWidth onClick={() => setAnchor(null)} sx={styles.done}>
          Done
        </Button>
      </Popover>
    </SearchFieldShell>
  );
}
