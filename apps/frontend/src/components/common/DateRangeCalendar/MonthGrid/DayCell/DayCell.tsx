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
}

export default function DayCell({ day, disabled, isStart, isEnd, inRange, onPick, onHover }: DayCellProps) {
  const date = parseIso(day);
  const label = date.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const selected = isStart || isEnd;
  return (
    <ButtonBase
      role="gridcell"
      disabled={disabled}
      aria-label={label}
      aria-selected={selected}
      onClick={() => onPick(day)}
      onMouseEnter={() => onHover(day)}
      onFocus={() => onHover(day)}
      sx={styles.root({ selected, inRange, isStart, isEnd, disabled })}
    >
      {date.getDate()}
    </ButtonBase>
  );
}
