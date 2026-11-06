"use client";

import { useId, useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import ButtonBase from "@mui/material/ButtonBase";
import Divider from "@mui/material/Divider";
import Popover from "@mui/material/Popover";
import Typography from "@mui/material/Typography";
import PersonOutlineRounded from "@mui/icons-material/PersonOutlineRounded";
import SearchFieldShell from "@/components/search/SearchFieldShell";
import { AGE_NOT_SET, GUEST_LIMITS, resizeAges } from "../searchCriteria";
import CounterRow from "@/components/common/CounterRow";
import ChildAgeSelect from "./ChildAgeSelect";
import { styles } from "./GuestsField.styles";

interface Guests {
  rooms: number;
  adults: number;
  children: number;
  childAges: number[];
}

interface GuestsFieldProps {
  rooms: number;
  adults: number;
  // Named childCount because `children` is React's own prop.
  childCount: number;
  childAges: number[];
  // Set after a search attempt with a guest problem (e.g. a child's age missing).
  invalid?: boolean;
  onChange: (guests: Guests) => void;
}

const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? "" : "s"}`;

// "2 Guests" button opening counters for rooms, adults and children, plus an
// age dropdown per child (suppliers price rooms by age).
export default function GuestsField({ rooms, adults, childCount, childAges, invalid = false, onChange }: GuestsFieldProps) {
  // The button the panel opens under; null while it's closed.
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const open = anchor !== null;
  const panelId = useId();
  const ages = resizeAges(childAges, childCount);
  const guests: Guests = { rooms, adults, children: childCount, childAges: ages };
  const set = (key: "rooms" | "adults" | "children") => (value: number) =>
    onChange({ ...guests, [key]: value, childAges: key === "children" ? resizeAges(ages, value) : ages });
  const setAge = (child: number) => (age: number) =>
    onChange({ ...guests, childAges: ages.map((value, i) => (i === child ? age : value)) });

  const label = `${plural(adults + childCount, "Guest")}${rooms > 1 ? ` · ${plural(rooms, "Room")}` : ""}`;
  const missingAge = ages.includes(AGE_NOT_SET);

  return (
    <SearchFieldShell icon={<PersonOutlineRounded />}>
      <ButtonBase
        onClick={(event) => setAnchor(event.currentTarget)}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        aria-label={`Rooms and guests: ${label}`}
        sx={[styles.trigger, invalid && styles.triggerInvalid]}
      >
        {label}
      </ButtonBase>
      <Popover
        open={open}
        anchorEl={anchor}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        transformOrigin={{ vertical: "top", horizontal: "left" }}
        slotProps={{ paper: { id: panelId, role: "dialog", "aria-label": "Rooms and guests", sx: styles.paper } }}
      >
        <CounterRow label="Rooms" value={rooms} {...GUEST_LIMITS.rooms} onChange={set("rooms")} />
        <Divider />
        <CounterRow label="Adults" hint="Ages 18+" value={adults} {...GUEST_LIMITS.adults} onChange={set("adults")} />
        <Divider />
        <CounterRow label="Children" hint="Ages 0–17" value={childCount} {...GUEST_LIMITS.children} onChange={set("children")} />
        {childCount > 0 && (
          <Box sx={styles.ages}>
            <Typography sx={styles.agesHint}>Age at check-in, so we show the right prices.</Typography>
            <Box sx={styles.agesGrid}>
              {ages.map((age, child) => (
                <ChildAgeSelect key={child} number={child + 1} age={age} invalid={invalid} onChange={setAge(child)} />
              ))}
            </Box>
          </Box>
        )}
        <Button variant="contained" fullWidth onClick={() => setAnchor(null)} sx={styles.done}>
          {missingAge ? "Done (ages needed)" : "Done"}
        </Button>
      </Popover>
    </SearchFieldShell>
  );
}
