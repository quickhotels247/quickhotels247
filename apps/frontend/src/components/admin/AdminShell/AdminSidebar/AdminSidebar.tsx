"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Typography from "@mui/material/Typography";
import type { SvgIconComponent } from "@mui/icons-material";
import AdminPanelSettingsOutlined from "@mui/icons-material/AdminPanelSettingsOutlined";
import BookOnlineOutlined from "@mui/icons-material/BookOnlineOutlined";
import DashboardOutlined from "@mui/icons-material/DashboardOutlined";
import LocalOfferOutlined from "@mui/icons-material/LocalOfferOutlined";
import PaymentsOutlined from "@mui/icons-material/PaymentsOutlined";
import PeopleOutlineRounded from "@mui/icons-material/PeopleOutlineRounded";
import SettingsOutlined from "@mui/icons-material/SettingsOutlined";
import SupportAgentOutlined from "@mui/icons-material/SupportAgentOutlined";
import Logo from "@/components/brand/Logo";
import { routes } from "@/config/navigation";
import { styles } from "./AdminSidebar.styles";

interface Item {
  label: string;
  href?: string;
  icon: SvgIconComponent;
}

// Spec §5 sections. Ones without a page yet show as "soon".
const SECTIONS: { title: string; items: Item[] }[] = [
  { title: "", items: [{ label: "Overview", href: routes.admin, icon: DashboardOutlined }] },
  {
    title: "Operations",
    items: [
      { label: "Bookings", icon: BookOnlineOutlined },
      { label: "Payments & refunds", icon: PaymentsOutlined },
      { label: "Support", icon: SupportAgentOutlined },
    ],
  },
  {
    title: "People",
    items: [
      { label: "Customers", href: routes.adminCustomers, icon: PeopleOutlineRounded },
      { label: "Admin team", href: routes.adminTeam, icon: AdminPanelSettingsOutlined },
    ],
  },
  {
    title: "Settings",
    items: [
      { label: "Coupons & pricing", icon: LocalOfferOutlined },
      { label: "Account settings", href: routes.adminSettings, icon: SettingsOutlined },
    ],
  },
];

const active = (pathname: string, href: string) => (href === routes.admin ? pathname === href : pathname.startsWith(href));

// The console's navigation (spec §5).
export default function AdminSidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <Box component="nav" aria-label="Admin" sx={styles.root}>
      <Box sx={styles.brand}>
        <Logo />
        <Typography sx={styles.badge}>Admin</Typography>
      </Box>
      {SECTIONS.map((section) => (
        <Box key={section.title || "main"} sx={styles.section}>
          {section.title && <Typography sx={styles.sectionTitle}>{section.title}</Typography>}
          <List dense disablePadding>
            {section.items.map(({ label, href, icon: Icon }) =>
              href ? (
                <ListItemButton key={label} component={Link} href={href} selected={active(pathname, href)} onClick={onNavigate} sx={styles.item}>
                  <ListItemIcon sx={styles.icon}>
                    <Icon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText primary={label} />
                </ListItemButton>
              ) : (
                <ListItemButton key={label} disabled sx={styles.item}>
                  <ListItemIcon sx={styles.icon}>
                    <Icon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText primary={label} />
                  <Chip label="soon" size="small" sx={styles.soon} />
                </ListItemButton>
              ),
            )}
          </List>
        </Box>
      ))}
    </Box>
  );
}
