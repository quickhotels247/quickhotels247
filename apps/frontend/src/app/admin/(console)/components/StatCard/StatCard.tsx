import Link from "next/link";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { styles } from "./StatCard.styles";

interface StatCardProps {
  label: string;
  value: string;
  note?: string;
  // Opens the matching list (e.g. bookings waiting for the hotel).
  href?: string;
  tone?: "default" | "warning";
}

// One headline number on the overview.
export default function StatCard({ label, value, note, href, tone = "default" }: StatCardProps) {
  const body = (
    <>
      <Typography sx={styles.label}>{label}</Typography>
      <Typography sx={[styles.value, tone === "warning" && styles.warning]}>{value}</Typography>
      {note && <Typography sx={styles.note}>{note}</Typography>}
    </>
  );
  return href ? (
    <Box component={Link} href={href} sx={[styles.root, styles.link]}>
      {body}
    </Box>
  ) : (
    <Box sx={styles.root}>{body}</Box>
  );
}
