import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import type { SvgIconComponent } from "@mui/icons-material";
import { styles } from "./WhyBookItem.styles";

interface WhyBookItemProps {
  icon: SvgIconComponent;
  title: string;
  text: string;
}

export default function WhyBookItem({ icon: Icon, title, text }: WhyBookItemProps) {
  return (
    <Box sx={styles.root}>
      <Box sx={styles.badge} aria-hidden="true">
        <Icon />
      </Box>
      <Box>
        <Typography component="h2" sx={styles.title}>
          {title}
        </Typography>
        <Typography sx={styles.text}>{text}</Typography>
      </Box>
    </Box>
  );
}
