"use client";

import Link from "next/link";
import { useParams, usePathname, useSearchParams } from "next/navigation";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Skeleton from "@mui/material/Skeleton";
import BookingProblem from "@/components/booking/BookingProblem";
import PolicyCard from "@/components/booking/PolicyCard";
import PriceCard from "@/components/booking/PriceCard";
import StayCard from "@/components/booking/StayCard";
import SupportCard from "@/components/booking/SupportCard";
import { routes } from "@/config/navigation";
import { useAuth } from "@/lib/auth/useAuth";
import { useBooking } from "@/lib/hooks/useBooking";
import ConfirmationBanner from "../components/ConfirmationBanner";
import { styles } from "./BookingConfirmationPage.styles";

// Booking confirmation (spec §4.6): where checkout ends. ?checkout=<id> lets
// a guest who booked without an account open it from the same browser.
export default function BookingConfirmationPage() {
  const { reference } = useParams<{ reference: string }>();
  const params = useSearchParams();
  const pathname = usePathname();
  const { user } = useAuth();
  const { booking, problem, message, loading, refresh } = useBooking(decodeURIComponent(reference), params.get("checkout"));

  if (problem) return <BookingProblem problem={problem} message={message} next={`${pathname}?${params}`} />;
  return (
    <Container sx={styles.root}>
      {!booking ? (
        <Box aria-busy="true" sx={styles.loading}>
          <Skeleton variant="rounded" height={160} sx={styles.skeleton} />
          <Skeleton variant="rounded" height={320} sx={styles.skeleton} />
        </Box>
      ) : (
        <>
          <ConfirmationBanner booking={booking} checking={loading} onCheckAgain={refresh} />
          <Box sx={styles.grid}>
            <Box sx={styles.main}>
              <StayCard booking={booking} />
              <PolicyCard booking={booking} />
            </Box>
            <Box sx={styles.side}>
              <PriceCard booking={booking} />
              <SupportCard reference={booking.reference} voucherReady={booking.status === "confirmed"} />
              {user ? (
                <Button variant="contained" component={Link} href={`${routes.myBookings}/${encodeURIComponent(booking.reference)}`} fullWidth>
                  View in My bookings
                </Button>
              ) : (
                <Button variant="contained" component={Link} href={routes.home} fullWidth>
                  Back to home
                </Button>
              )}
            </Box>
          </Box>
        </>
      )}
    </Container>
  );
}
