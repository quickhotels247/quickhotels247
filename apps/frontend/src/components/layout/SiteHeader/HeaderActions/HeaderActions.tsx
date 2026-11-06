"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Skeleton from "@mui/material/Skeleton";
import MenuRounded from "@mui/icons-material/MenuRounded";
import PersonOutlineRounded from "@mui/icons-material/PersonOutlineRounded";
import { routes } from "@/config/navigation";
import { useAuth } from "@/lib/auth/useAuth";
import AccountMenu from "../AccountMenu";
import { styles } from "./HeaderActions.styles";

interface HeaderActionsProps {
  onOpenMenu: () => void;
}

// Signed out: Register and Sign in (back to this page afterwards). Signed in:
// the account menu. Phones: account icon and menu button.
export default function HeaderActions({ onOpenMenu }: HeaderActionsProps) {
  const { user, status } = useAuth();
  const pathname = usePathname();
  const params = useSearchParams();
  const here = `${pathname}${params.size ? `?${params}` : ""}`;
  const withNext = (href: string) => (pathname === "/" ? href : `${href}?${new URLSearchParams({ next: here })}`);

  return (
    <Box sx={styles.root}>
      <Box sx={styles.desktop}>
        {status === "loading" ? (
          <Skeleton variant="rounded" width={180} height={36} />
        ) : user ? (
          <AccountMenu user={user} />
        ) : (
          <>
            <Button component={Link} href={withNext(routes.signup)} variant="outlined" sx={styles.register}>
              Register
            </Button>
            <Button component={Link} href={withNext(routes.login)} variant="contained" sx={styles.signIn}>
              Sign in
            </Button>
          </>
        )}
      </Box>
      <Box sx={styles.mobile}>
        {user ? (
          <AccountMenu user={user} compact />
        ) : (
          <IconButton component={Link} href={withNext(routes.login)} aria-label="Sign in" sx={styles.icon}>
            <PersonOutlineRounded />
          </IconButton>
        )}
        <IconButton onClick={onOpenMenu} aria-label="Open menu" sx={styles.icon}>
          <MenuRounded />
        </IconButton>
      </Box>
    </Box>
  );
}
