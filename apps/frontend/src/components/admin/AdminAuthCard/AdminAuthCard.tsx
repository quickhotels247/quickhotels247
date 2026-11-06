import type { ReactNode } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Logo from "@/components/brand/Logo";
import { styles } from "./AdminAuthCard.styles";

// Centred card for admin sign-in and first-admin setup.
export default function AdminAuthCard({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <Box sx={styles.page}>
      <Box sx={styles.card}>
        <Box sx={styles.brand}>
          <Logo />
          <Typography sx={styles.badge}>Admin</Typography>
        </Box>
        <Typography component="h1" sx={styles.title}>
          {title}
        </Typography>
        <Typography sx={styles.subtitle}>{subtitle}</Typography>
        {children}
      </Box>
    </Box>
  );
}
