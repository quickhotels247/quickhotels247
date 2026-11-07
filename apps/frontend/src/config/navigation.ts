import type { SvgIconComponent } from "@mui/icons-material";
import BookmarkBorderRounded from "@mui/icons-material/BookmarkBorderRounded";
import FlightRounded from "@mui/icons-material/FlightRounded";
import HomeOutlined from "@mui/icons-material/HomeOutlined";
import HotelRounded from "@mui/icons-material/HotelRounded";
import PersonOutlineRounded from "@mui/icons-material/PersonOutlineRounded";

export interface NavItem {
  label: string;
  href: string;
  icon: SvgIconComponent;
}

// Routes from the spec's sitemap (§2.1). Pages appear as each roadmap step lands.
export const routes = {
  home: "/",
  hotels: "/hotels/search",
  checkout: "/checkout",
  flights: "/flights",
  flightSearch: "/flights/search",
  // Fare check and travellers for the chosen flights (flights step F4).
  flightReview: "/flights/review",
  flightBooking: "/flights/booking",
  myBookings: "/account/bookings",
  account: "/account",
  savedTravellers: "/account/travellers",
  savedHotels: "/account/saved",
  accountProfile: "/account/profile",
  accountSecurity: "/account/security",
  accountPreferences: "/account/preferences",
  login: "/login",
  signup: "/signup",
  // Google sends the browser back here through Clerk.
  ssoCallback: "/sso-callback",
  help: "/help",
  privacy: "/privacy",
  terms: "/terms",
  // Admin console (separate sign-in).
  admin: "/admin",
  adminLogin: "/admin/login",
  adminSetup: "/admin/setup",
  adminCustomers: "/admin/customers",
  adminTeam: "/admin/team",
  adminSettings: "/admin/settings",
  adminPricing: "/admin/pricing",
  adminSupport: "/admin/support",
  adminCoupons: "/admin/coupons",
} as const;

// Account links for the phone menu. Home and hotel search live under Stays.
export const mainNav: NavItem[] = [
  { label: "My Bookings", href: routes.myBookings, icon: BookmarkBorderRounded },
];

// Products under the logo, like Booking.com's Stays / Flights row. A product
// is active on its own pages; Stays also covers the home page.
export interface ProductItem extends NavItem {
  id: "stays" | "flights";
  matches: (pathname: string) => boolean;
}

export const productNav: ProductItem[] = [
  {
    id: "stays",
    label: "Stays",
    href: routes.home,
    icon: HotelRounded,
    matches: (pathname) => pathname === "/" || pathname.startsWith("/hotels"),
  },
  {
    id: "flights",
    label: "Flights",
    href: routes.flights,
    icon: FlightRounded,
    matches: (pathname) => pathname.startsWith("/flights"),
  },
];

// Phone-width tab bar (design: Home, My Bookings, Profile).
export const bottomNav: NavItem[] = [
  { label: "Home", href: routes.home, icon: HomeOutlined },
  { label: "My Bookings", href: routes.myBookings, icon: BookmarkBorderRounded },
  { label: "Profile", href: routes.account, icon: PersonOutlineRounded },
];

export const isActive = (pathname: string, href: string) =>
  href === "/" ? pathname === "/" : pathname.startsWith(href);
