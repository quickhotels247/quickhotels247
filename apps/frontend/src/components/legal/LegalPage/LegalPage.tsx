import type { ReactNode } from "react";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import { styles } from "./LegalPage.styles";

interface LegalPageProps {
  title: string;
  // The version customers accept at checkout, when this page is versioned.
  version?: string;
  children: ReactNode;
}

// Shared frame for the Terms of Service and Privacy Policy.
export default function LegalPage({ title, version, children }: LegalPageProps) {
  return (
    <Container maxWidth="md" component="article" sx={styles.root}>
      <Typography component="h1" sx={styles.title}>
        {title}
      </Typography>
      {version && <Typography sx={styles.version}>Version {version}</Typography>}
      <Box sx={styles.body}>{children}</Box>
    </Container>
  );
}
