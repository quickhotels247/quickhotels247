import Link from "next/link";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import { styles } from "./SsoStatus.styles";

interface SsoStatusProps {
  // Shown instead of the spinner when signing in failed.
  error?: string;
  backTo: string;
}

// "Signing you in…", or what went wrong and a way back.
export default function SsoStatus({ error, backTo }: SsoStatusProps) {
  return (
    <Container sx={styles.root}>
      {error ? (
        <Box role="alert">
          <Typography component="h1" sx={styles.title}>
            We couldn&apos;t sign you in
          </Typography>
          <Typography sx={styles.text}>{error}</Typography>
          <Button variant="contained" component={Link} href={backTo}>
            Try again
          </Button>
        </Box>
      ) : (
        <Box role="status" sx={styles.waiting}>
          <CircularProgress />
          <Typography component="h1" sx={styles.title}>
            Signing you in…
          </Typography>
        </Box>
      )}
    </Container>
  );
}
