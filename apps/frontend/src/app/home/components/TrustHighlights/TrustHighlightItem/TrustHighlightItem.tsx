import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import type { SvgIconComponent } from "@mui/icons-material";
import { styles } from "./TrustHighlightItem.styles";

interface TrustHighlightItemProps {
  icon: SvgIconComponent;
  title: string;
  detail: string;
}

// Icon in a soft blue circle with a two-line label.
export default function TrustHighlightItem({ icon: Icon, title, detail }: TrustHighlightItemProps) {
  return (
    <Box sx={styles.root}>
      <Box sx={styles.badge} aria-hidden="true">
        <Icon />
      </Box>
      <Typography sx={styles.text}>
        {title}
        <br />
        {detail}
      </Typography>
    </Box>
  );
}
