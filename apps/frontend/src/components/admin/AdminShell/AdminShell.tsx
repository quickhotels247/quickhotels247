"use client";

import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import AppBar from "@mui/material/AppBar";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Drawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import LogoutRounded from "@mui/icons-material/LogoutRounded";
import MenuRounded from "@mui/icons-material/MenuRounded";
import { routes } from "@/config/navigation";
import { useAdminAuth } from "@/lib/admin/AdminAuthProvider";
import AdminSidebar from "./AdminSidebar";
import { styles } from "./AdminShell.styles";

// The console's frame (spec §5): sidebar (a drawer on phones), a top bar
// with the signed-in admin and sign-out, and the page.
export default function AdminShell({ children }: { children: ReactNode }) {
  const { admin, logout } = useAdminAuth();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <Box sx={styles.root}>
      <Box sx={styles.sidebar}>
        <AdminSidebar />
      </Box>
      <Drawer open={menuOpen} onClose={() => setMenuOpen(false)} sx={styles.drawer}>
        <AdminSidebar onNavigate={() => setMenuOpen(false)} />
      </Drawer>
      <Box sx={styles.main}>
        <AppBar position="sticky" color="inherit" elevation={0} sx={styles.bar}>
          <Toolbar sx={styles.toolbar}>
            <IconButton onClick={() => setMenuOpen(true)} aria-label="Open menu" sx={styles.menuButton}>
              <MenuRounded />
            </IconButton>
            <Box sx={styles.spacer} />
            {admin && (
              <Box sx={styles.who}>
                <Avatar sx={styles.avatar}>{admin.name.charAt(0).toUpperCase()}</Avatar>
                <Box sx={styles.whoText}>
                  <Typography sx={styles.name}>{admin.name}</Typography>
                  <Typography sx={styles.email}>{admin.email}</Typography>
                </Box>
              </Box>
            )}
            <Button
              startIcon={<LogoutRounded />}
              onClick={async () => {
                await logout();
                router.replace(routes.adminLogin);
              }}
              sx={styles.logout}
            >
              Sign out
            </Button>
          </Toolbar>
        </AppBar>
        <Box component="main" sx={styles.content}>
          {children}
        </Box>
      </Box>
    </Box>
  );
}
