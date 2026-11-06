"use client";

import Link from "next/link";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import MuiLink from "@mui/material/Link";
import Typography from "@mui/material/Typography";
import Logo from "@/components/brand/Logo";
import { CONTACT_EMAIL } from "@/config/site";
import { routes } from "@/config/navigation";
import { styles } from "./SiteFooter.styles";

const links = [
  { label: "Help & support", href: routes.help },
  { label: "Terms of Service", href: routes.terms },
  { label: "Privacy Policy", href: routes.privacy },
];

export default function SiteFooter() {
  return (
    <Box component="footer" sx={styles.root}>
      <Container sx={styles.container}>
        <Box sx={styles.brand}>
          <Logo />
          <Typography variant="body2" color="text.secondary">
            Questions? <MuiLink href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</MuiLink>
          </Typography>
        </Box>
        <Box component="nav" aria-label="Footer" sx={styles.links}>
          {links.map((link) => (
            <MuiLink key={link.href} component={Link} href={link.href} sx={styles.link}>
              {link.label}
            </MuiLink>
          ))}
        </Box>
        <Typography variant="caption" color="text.secondary" sx={styles.copyright}>
          © {new Date().getFullYear()} QuickHotels24/7. All rights reserved.
        </Typography>
      </Container>
    </Box>
  );
}
