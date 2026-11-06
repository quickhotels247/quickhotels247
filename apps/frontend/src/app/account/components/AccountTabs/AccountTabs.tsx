"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import { routes } from "@/config/navigation";
import { styles } from "./AccountTabs.styles";

const TABS = [
  { label: "Overview", href: routes.account },
  { label: "My bookings", href: routes.myBookings },
  { label: "Saved hotels", href: routes.savedHotels },
  { label: "Saved travellers", href: routes.savedTravellers },
  { label: "Personal details", href: routes.accountProfile },
  { label: "Security", href: routes.accountSecurity },
  { label: "Email preferences", href: routes.accountPreferences },
];

// The account sections, as tabs across every account page (scroll on phones).
export default function AccountTabs() {
  const pathname = usePathname();
  // The longest matching link wins, so /account/saved isn't "Overview".
  const current =
    TABS.filter((tab) => pathname === tab.href || pathname.startsWith(`${tab.href}/`)).sort((a, b) => b.href.length - a.href.length)[0]?.href ?? routes.account;
  return (
    <Tabs value={current} aria-label="Your account" variant="scrollable" scrollButtons={false} sx={styles.root}>
      {TABS.map((tab) => (
        <Tab key={tab.href} value={tab.href} label={tab.label} component={Link} href={tab.href} sx={styles.tab} />
      ))}
    </Tabs>
  );
}
