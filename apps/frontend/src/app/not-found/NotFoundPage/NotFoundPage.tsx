"use client";

import Link from "next/link";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import { routes } from "@/config/navigation";
import { styles } from "./NotFoundPage.styles";

// Unknown pages, and pages that later roadmap steps haven't built yet.
export default function NotFoundPage() {
  return (
    <Container maxWidth="sm" sx={styles.root}>
      <Typography variant="h1" sx={styles.title}>
        This page isn&apos;t available yet
      </Typography>
      <Typography color="text.secondary" sx={styles.text}>
        It may not exist, or it&apos;s still being built. Start a new search from the home page.
      </Typography>
      <Button component={Link} href={routes.home} variant="contained" size="large">
        Back to Home
      </Button>
    </Container>
  );
}
