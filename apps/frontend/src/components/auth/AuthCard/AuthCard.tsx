import type { ReactNode } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import CheckCircleRounded from "@mui/icons-material/CheckCircleRounded";
import Logo from "@/components/brand/Logo";
import { styles } from "./AuthCard.styles";

interface AuthCardProps {
  title: string;
  subtitle: string;
  children: ReactNode;
}

const PERKS = ["Manage your bookings in one place", "Faster checkout with your details saved", "Free cancellation on many stays"];

// Frame for log in and sign up: why sign in on the left (desktop), the form
// on the right.
export default function AuthCard({ title, subtitle, children }: AuthCardProps) {
  return (
    <Box sx={styles.root}>
      <Box sx={styles.side} aria-hidden="true">
        <Typography sx={styles.sideTitle}>Your trips, all in one place</Typography>
        <Box component="ul" sx={styles.perks}>
          {PERKS.map((perk) => (
            <Box component="li" key={perk} sx={styles.perk}>
              <CheckCircleRounded sx={styles.perkIcon} />
              {perk}
            </Box>
          ))}
        </Box>
      </Box>
      <Box sx={styles.panel}>
        <Box sx={styles.header}>
          <Logo />
          <Typography component="h1" sx={styles.title}>
            {title}
          </Typography>
          <Typography sx={styles.subtitle}>{subtitle}</Typography>
        </Box>
        {children}
      </Box>
    </Box>
  );
}
