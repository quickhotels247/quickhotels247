"use client";

import Link from "next/link";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import LuggageOutlined from "@mui/icons-material/LuggageOutlined";
import { routes } from "@/config/navigation";
import { styles } from "./AccountBanner.styles";

// Sign-in prompt. Once login is built (roadmap step 4e) it should hide for
// visitors who are already signed in.
export default function AccountBanner() {
  return (
    <Box component="section" aria-labelledby="account-banner" sx={styles.root}>
      <Box sx={styles.icon} aria-hidden="true">
        <LuggageOutlined />
      </Box>
      <Box sx={styles.text}>
        <Typography id="account-banner" component="h2" sx={styles.title}>
          Your trips, all in one place
        </Typography>
        <Typography sx={styles.description}>
          Sign in to see your bookings, manage cancellations and get updates about your stay.
        </Typography>
      </Box>
      <Box sx={styles.actions}>
        <Button component={Link} href={routes.login} variant="contained" sx={styles.signIn}>
          Sign in
        </Button>
        <Button component={Link} href={routes.signup} variant="outlined" sx={styles.register}>
          Create account
        </Button>
      </Box>
    </Box>
  );
}
