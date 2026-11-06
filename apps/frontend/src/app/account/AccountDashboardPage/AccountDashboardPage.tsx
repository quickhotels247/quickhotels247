"use client";

import Box from "@mui/material/Box";
import BadgeOutlined from "@mui/icons-material/BadgeOutlined";
import BookmarkBorderRounded from "@mui/icons-material/BookmarkBorderRounded";
import FavoriteBorderRounded from "@mui/icons-material/FavoriteBorderRounded";
import GroupOutlined from "@mui/icons-material/GroupOutlined";
import MarkEmailReadOutlined from "@mui/icons-material/MarkEmailReadOutlined";
import ShieldOutlined from "@mui/icons-material/ShieldOutlined";
import type { User } from "@quickhotels/types/users";
import { routes } from "@/config/navigation";
import { useAuth } from "@/lib/auth/useAuth";
import { useSavedTravellers } from "@/lib/hooks/useSavedTravellers";
import { useWishlist } from "@/lib/wishlist/useWishlist";
import AccountShell from "../components/AccountShell";
import DashboardTile from "../components/DashboardTile";
import { styles } from "./AccountDashboardPage.styles";

// What's still missing from the profile, as a nudge on its tile.
function profileStatus(user: User) {
  const missing = [!user.phone && "mobile number", !user.dateOfBirth && "date of birth", !user.address && "address"].filter(Boolean);
  if (!missing.length) return "Complete";
  return `Add your ${missing.join(", ")}`;
}

const count = (n: number, one: string, many: string) => (n ? `${n} ${n === 1 ? one : many}` : null);

// The account overview (like Booking.com's "Manage account"): one tile per section.
export default function AccountDashboardPage() {
  const { user } = useAuth();
  const { hotels, ready } = useWishlist();
  const travellers = useSavedTravellers();
  return (
    <AccountShell title={user ? `Hi, ${user.firstName}` : "Your account"} subtitle="Manage your trips, saved items and account settings.">
      {user && (
        <Box sx={styles.grid}>
          <DashboardTile href={routes.myBookings} icon={BookmarkBorderRounded} title="My bookings" description="Upcoming, past and cancelled trips." />
          <DashboardTile
            href={routes.savedHotels}
            icon={FavoriteBorderRounded}
            title="Saved hotels"
            description="Hotels you saved with the heart."
            status={ready ? count(hotels.length, "hotel saved", "hotels saved") : null}
          />
          <DashboardTile
            href={routes.savedTravellers}
            icon={GroupOutlined}
            title="Saved travellers"
            description="People you book for, to fill checkout faster."
            status={count(travellers.length, "traveller", "travellers")}
          />
          <DashboardTile href={routes.accountProfile} icon={BadgeOutlined} title="Personal details" description="Name, contact, date of birth and address." status={profileStatus(user)} />
          <DashboardTile href={routes.accountSecurity} icon={ShieldOutlined} title="Security" description="Sign-in methods, devices and deleting your account." />
          <DashboardTile href={routes.accountPreferences} icon={MarkEmailReadOutlined} title="Email preferences" description="Choose which emails you get from us." />
        </Box>
      )}
    </AccountShell>
  );
}
