import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import { parseIso } from "@/lib/dates";
import { styles } from "./DayCell.styles";

interface DayCellProps {
  day: string; // YYYY-MM-DD
  disabled: boolean;
  isStart: boolean;
  isEnd: boolean;
  inRange: boolean;
  onPick: (day: string) => void;
  onHover: (day: string | null) => void;
  // A fare under the date (flights); `cheapest` shows it in green.
  price?: { label: string; cheapest: boolean } | null;
  // Leave room for prices in every cell, so rows line up.
  withPrices?: boolean;
}

export default function DayCell({ day, disabled, isStart, isEnd, inRange, onPick, onHover, price = null, withPrices = false }: DayCellProps) {
  const date = parseIso(day);
  const label = date.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const selected = isStart || isEnd;
  return (
    <ButtonBase
      role="gridcell"
      disabled={disabled}
      aria-label={price ? `${label}, from ${price.label}` : label}
      aria-selected={selected}
      onClick={() => onPick(day)}
      onMouseEnter={() => onHover(day)}
      onFocus={() => onHover(day)}
      sx={styles.root({ selected, inRange, isStart, isEnd, disabled, withPrices })}
    >
      {date.getDate()}
      {withPrices && (
        <Box component="span" aria-hidden="true" sx={styles.price(selected, Boolean(price?.cheapest))}>
          {disabled ? "" : (price?.label ?? "")}
        </Box>
      )}
    </ButtonBase>
  );
}
