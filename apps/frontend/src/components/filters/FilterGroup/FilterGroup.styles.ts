export const styles = {
  root: {
    border: 0,
    m: 0,
    p: 2,
    minWidth: 0,
    "& + &": { borderTop: 1, borderColor: "divider" },
    // Without the float, browsers draw the legend on top of the border line.
    "& > :not(legend)": { clear: "both" },
  },
  title: { float: "left", width: "100%", p: 0, mb: 1, fontSize: "0.92rem", fontWeight: 700 },
};
