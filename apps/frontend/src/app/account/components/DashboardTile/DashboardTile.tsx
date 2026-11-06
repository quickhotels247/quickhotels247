import Link from "next/link";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import ChevronRightRounded from "@mui/icons-material/ChevronRightRounded";
import type { SvgIconComponent } from "@mui/icons-material";
import { styles } from "./DashboardTile.styles";

interface DashboardTileProps {
  href: string;
  icon: SvgIconComponent;
  title: string;
  description: string;
  // A short status: "3 saved", "Add your date of birth".
  status?: string | null;
}

// One section on the account overview, linking to its page.
export default function DashboardTile({ href, icon: Icon, title, description, status }: DashboardTileProps) {
  return (
    <Box component={Link} href={href} sx={styles.root}>
      <Box sx={styles.icon}>
        <Icon />
      </Box>
      <Box sx={styles.text}>
        <Typography component="h2" sx={styles.title}>
          {title}
        </Typography>
        <Typography sx={styles.description}>{description}</Typography>
        {status && <Typography sx={styles.status}>{status}</Typography>}
      </Box>
      <ChevronRightRounded sx={styles.chevron} />
    </Box>
  );
}
