"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Breadcrumbs from "@mui/material/Breadcrumbs";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import MuiLink from "@mui/material/Link";
import Skeleton from "@mui/material/Skeleton";
import Typography from "@mui/material/Typography";
import BookingProblem from "@/components/booking/BookingProblem";
import BookingStatusChip from "@/components/booking/BookingStatusChip";
import CancelBooking from "@/components/booking/CancelBooking";
import PolicyCard from "@/components/booking/PolicyCard";
import PriceCard from "@/components/booking/PriceCard";
import StatusTimeline from "@/components/booking/StatusTimeline";
import StayCard from "@/components/booking/StayCard";
import SupportCard from "@/components/booking/SupportCard";
import { routes } from "@/config/navigation";
import { useBooking } from "@/lib/hooks/useBooking";
import { styles } from "./BookingDetailsPage.styles";

// Booking details (spec §4.8) for its signed-in owner: references and
// status, the stay, payment, cancellation terms, history and support.
export default function BookingDetailsPage() {
  const { reference } = useParams<{ reference: string }>();
  const pathname = usePathname();
  const { booking, problem, message, loading, refresh, downloadVoucher, cancel } = useBooking(decodeURIComponent(reference), null);

  // A cancellation in progress: look again every 5 seconds.
  const cancelling = booking?.status === "cancellation_pending";
  useEffect(() => {
    if (!cancelling || loading) return;
    const timer = setTimeout(refresh, 5000);
    return () => clearTimeout(timer);
  }, [cancelling, loading, refresh]);

  if (problem) return <BookingProblem problem={problem} message={message} next={pathname} />;
  return (
    <Container sx={styles.root}>
      <Breadcrumbs aria-label="Breadcrumb" sx={styles.crumbs}>
        <MuiLink component={Link} href={routes.myBookings} underline="hover" color="inherit">
          My bookings
        </MuiLink>
        <Typography sx={styles.crumbCurrent}>{decodeURIComponent(reference)}</Typography>
      </Breadcrumbs>
      {!booking ? (
        <Box sx={styles.grid} aria-busy="true">
          <Skeleton variant="rounded" height={360} sx={styles.skeleton} />
          <Skeleton variant="rounded" height={240} sx={styles.skeleton} />
        </Box>
      ) : (
        <>
          <Box sx={styles.header}>
            <Box>
              <Typography component="h1" sx={styles.title}>
                Booking {booking.reference}
              </Typography>
              {booking.supplierConfirmation && <Typography sx={styles.sub}>Hotel confirmation number: {booking.supplierConfirmation}</Typography>}
            </Box>
            <BookingStatusChip status={booking.status} />
          </Box>
          {booking.status === "pending" && (
            <Alert severity="info" action={<Button color="inherit" size="small" onClick={refresh} disabled={loading}>{loading ? "Checking…" : "Check again"}</Button>}>
              We&apos;re waiting for the hotel to confirm. Please don&apos;t book again; we&apos;ll email you as soon as it&apos;s confirmed.
            </Alert>
          )}
          {booking.status === "action_required" && (
            <Alert severity="error">Something needs our attention with this booking. Our team will contact you; quote {booking.reference} if you contact us.</Alert>
          )}
          <Box sx={styles.grid}>
            <Box sx={styles.main}>
              <StayCard booking={booking} />
              <PolicyCard booking={booking}>
                <CancelBooking booking={booking} onCancel={cancel} />
              </PolicyCard>
              <StatusTimeline timeline={booking.timeline} />
            </Box>
            <Box sx={styles.side}>
              <PriceCard booking={booking} />
              <SupportCard reference={booking.reference} voucherReady={booking.status === "confirmed"} onDownloadVoucher={downloadVoucher} />
            </Box>
          </Box>
        </>
      )}
    </Container>
  );
}
