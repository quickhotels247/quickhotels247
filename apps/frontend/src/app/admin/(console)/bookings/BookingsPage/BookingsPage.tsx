"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import FlightBookingsList from "../components/FlightBookingsList";
import HotelBookingsList from "../components/HotelBookingsList";
import { styles } from "./BookingsPage.styles";

// Bookings for staff: hotels (default) or flights (?product=flights), each
// with its own states, search and actions.
export default function BookingsPage() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const product = params.get("product") === "flights" ? "flights" : "hotels";
  return (
    <>
      <AdminPageHeader
        title="Bookings"
        subtitle={product === "hotels" ? "Hotel bookings: payment, confirmation with the hotel, cancellations and refunds." : "Flight bookings: payment, ticketing with TripJack and refunds."}
      />
      <ToggleButtonGroup
        exclusive
        size="small"
        value={product}
        // A different product starts from its first tab and page.
        onChange={(_, next: string | null) => next && router.replace(next === "flights" ? `${pathname}?product=flights` : pathname)}
        aria-label="Product"
        sx={styles.products}
      >
        <ToggleButton value="hotels">Hotels</ToggleButton>
        <ToggleButton value="flights">Flights</ToggleButton>
      </ToggleButtonGroup>
      {product === "hotels" ? <HotelBookingsList /> : <FlightBookingsList />}
    </>
  );
}
