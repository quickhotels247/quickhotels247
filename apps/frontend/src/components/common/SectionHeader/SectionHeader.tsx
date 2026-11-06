"use client";

import Link from "next/link";
import Box from "@mui/material/Box";
import MuiLink from "@mui/material/Link";
import Typography from "@mui/material/Typography";
import ArrowForwardRounded from "@mui/icons-material/ArrowForwardRounded";
import { styles } from "./SectionHeader.styles";

interface SectionHeaderProps {
  id: string;
  title: string;
  subtitle?: string;
  viewAllHref?: string;
}

// Section title, optional subtitle, and an optional "View all →" link.
export default function SectionHeader({ id, title, subtitle, viewAllHref }: SectionHeaderProps) {
  return (
    <Box sx={styles.root}>
      <Box>
        <Typography id={id} variant="h2" sx={styles.title}>
          {title}
        </Typography>
        {subtitle && <Typography sx={styles.subtitle}>{subtitle}</Typography>}
      </Box>
      {viewAllHref && (
        <MuiLink component={Link} href={viewAllHref} sx={styles.link} aria-label={`View all: ${title}`}>
          View all <ArrowForwardRounded sx={styles.icon} />
        </MuiLink>
      )}
    </Box>
  );
}
