"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import Drawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import CloseRounded from "@mui/icons-material/CloseRounded";
import HelpOutlineRounded from "@mui/icons-material/HelpOutlineRounded";
import Logo from "@/components/brand/Logo";
import { accountNav, isActive, mainNav, productNav, routes } from "@/config/navigation";
import { useAuth } from "@/lib/auth/useAuth";
import { styles } from "./MobileMenu.styles";

interface MobileMenuProps {
  open: boolean;
  onClose: () => void;
}

// Stays and Flights first, then account links (saved hotels and travellers
// when signed in) and help.
const menuItems = (signedIn: boolean) => [
  ...productNav.map(({ label, href, icon, matches }) => ({ label, href, icon, matches })),
  ...[...mainNav, ...(signedIn ? accountNav : []), { label: "Help & support", href: routes.help, icon: HelpOutlineRounded }].map((item) => ({
    ...item,
    matches: (pathname: string) => isActive(pathname, item.href),
  })),
];

// Phone-width menu from the right: Stays, Flights, My Bookings, help, and
// sign-in / register.
export default function MobileMenu({ open, onClose }: MobileMenuProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <Drawer anchor="right" open={open} onClose={onClose} slotProps={{ paper: { sx: styles.paper } }}>
      <Box sx={styles.header}>
        <Logo />
        <IconButton onClick={onClose} aria-label="Close menu">
          <CloseRounded />
        </IconButton>
      </Box>
      <Divider />
      <List component="nav" aria-label="Menu" sx={styles.list}>
        {menuItems(Boolean(user)).map(({ label, href, icon: Icon, matches }) => {
          const active = matches(pathname);
          return (
            <ListItemButton
              key={href}
              component={Link}
              href={href}
              selected={active}
              onClick={onClose}
              sx={styles.item}
            >
              <ListItemIcon sx={styles.icon(active)}>
                <Icon />
              </ListItemIcon>
              <ListItemText primary={label} />
            </ListItemButton>
          );
        })}
      </List>
      <Box sx={styles.actions}>
        {user ? (
          <>
            <Button component={Link} href={routes.account} variant="outlined" size="large" fullWidth onClick={onClose}>
              Account settings
            </Button>
            <Button
              variant="text"
              size="large"
              fullWidth
              onClick={async () => {
                onClose();
                await logout();
              }}
            >
              Sign out
            </Button>
          </>
        ) : (
          <>
            <Button component={Link} href={routes.login} variant="contained" size="large" fullWidth onClick={onClose}>
              Sign in
            </Button>
            <Button component={Link} href={routes.signup} variant="outlined" size="large" fullWidth onClick={onClose}>
              Register
            </Button>
          </>
        )}
      </Box>
    </Drawer>
  );
}
