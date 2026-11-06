interface DayState {
  selected: boolean;
  inRange: boolean;
  isStart: boolean;
  isEnd: boolean;
  disabled: boolean;
}

export const styles = {
  root: ({ selected, inRange, isStart, isEnd, disabled }: DayState) => ({
    height: 40,
    fontSize: "0.92rem",
    fontWeight: selected || inRange ? 700 : 500,
    color: selected ? "primary.contrastText" : disabled ? "text.disabled" : "text.primary",
    bgcolor: selected ? "primary.main" : inRange ? "primary.light" : "transparent",
    // Round the outer ends of a range; a lone selected day is fully rounded.
    borderRadius:
      isStart && isEnd ? 2 : isStart ? "8px 0 0 8px" : isEnd ? "0 8px 8px 0" : inRange ? 0 : 2,
    textDecoration: disabled ? "line-through" : "none",
    textDecorationColor: "rgba(100,116,139,0.4)",
    transition: "background-color 0.1s",
    "&:hover": !selected && !disabled ? { bgcolor: inRange ? "primary.light" : "action.hover", outline: "1px solid", outlineColor: "primary.main" } : {},
    "&.Mui-focusVisible": { outline: "2px solid", outlineColor: "primary.main", outlineOffset: -2 },
  }),
};
