"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import Divider from "@mui/material/Divider";
import ListItemIcon from "@mui/material/ListItemIcon";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Typography from "@mui/material/Typography";
import BookmarkBorderRounded from "@mui/icons-material/BookmarkBorderRounded";
import ExpandMoreRounded from "@mui/icons-material/ExpandMoreRounded";
import LogoutRounded from "@mui/icons-material/LogoutRounded";
import SettingsOutlined from "@mui/icons-material/SettingsOutlined";
import type { User } from "@quickhotels/types/users";
import { routes } from "@/config/navigation";
import { useAuth } from "@/lib/auth/useAuth";
import { styles } from "./AccountMenu.styles";

const initials = (user: User) => `${user.firstName[0] ?? ""}${user.lastName[0] ?? ""}`.toUpperCase() || "?";

// The signed-in customer's initials; opens My bookings, Account settings and Sign out.
export default function AccountMenu({ user, compact = false }: { user: User; compact?: boolean }) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const { logout } = useAuth();
  const router = useRouter();
  const close = () => setAnchor(null);

  return (
    <>
      <ButtonBase onClick={(event) => setAnchor(event.currentTarget)} aria-haspopup="menu" aria-expanded={Boolean(anchor)} aria-label="Your account" sx={styles.trigger}>
        <Avatar sx={styles.avatar}>{initials(user)}</Avatar>
        {!compact && (
          <>
            <Box component="span" sx={styles.name}>
              {user.firstName}
            </Box>
            <ExpandMoreRounded fontSize="small" />
          </>
        )}
      </ButtonBase>
      <Menu anchorEl={anchor} open={Boolean(anchor)} onClose={close} anchorOrigin={{ vertical: "bottom", horizontal: "right" }} transformOrigin={{ vertical: "top", horizontal: "right" }} slotProps={{ paper: { sx: styles.paper } }}>
        <Box sx={styles.who}>
          <Typography sx={styles.whoName}>
            {user.firstName} {user.lastName}
          </Typography>
          <Typography sx={styles.whoEmail}>{user.email}</Typography>
        </Box>
        <Divider />
        <MenuItem component={Link} href={routes.myBookings} onClick={close}>
          <ListItemIcon>
            <BookmarkBorderRounded fontSize="small" />
          </ListItemIcon>
          My bookings
        </MenuItem>
        <MenuItem component={Link} href={routes.account} onClick={close}>
          <ListItemIcon>
            <SettingsOutlined fontSize="small" />
          </ListItemIcon>
          Account settings
        </MenuItem>
        <Divider />
        <MenuItem
          onClick={async () => {
            close();
            await logout();
            router.push(routes.home);
          }}
        >
          <ListItemIcon>
            <LogoutRounded fontSize="small" />
          </ListItemIcon>
          Sign out
        </MenuItem>
      </Menu>
    </>
  );
}
