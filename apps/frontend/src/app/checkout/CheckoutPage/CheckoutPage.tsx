"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Skeleton from "@mui/material/Skeleton";
import Typography from "@mui/material/Typography";
import LockOutlined from "@mui/icons-material/LockOutlined";
import type { CheckoutSummary } from "@quickhotels/types/checkout";
import { criteriaParams } from "@/components/search/HotelSearchBar/searchCriteria";
import { routes } from "@/config/navigation";
import BookingSummary from "../components/BookingSummary";
import CheckoutSteps from "../components/CheckoutSteps";
import GuestDetailsForm from "../components/GuestDetailsForm";
import HoldTimer from "@/components/common/HoldTimer";
import PaymentNext from "../components/PaymentNext";
import PriceChangeNotice from "@/components/common/PriceChangeNotice";
import { useCheckout } from "../hooks/useCheckout";
import { styles } from "./CheckoutPage.styles";

// Back to the hotel with the same stay, to pick a room again.
const hotelHref = (checkout: CheckoutSummary) => {
  const query = criteriaParams({ ...checkout.stay, destination: "" });
  query.delete("destination");
  return `/hotels/${encodeURIComponent(checkout.hotel.id)}?${query}`;
};

// Secure checkout (spec §4.4): steps, the price hold, guest details on the
// left and the booking summary on the right. After the details, the payment
// step (step 8 of the roadmap).
export default function CheckoutPage() {
  const { checkoutId } = useParams<{ checkoutId: string }>();
  const { checkout, problem, message, saveGuests } = useCheckout(checkoutId);
  const [editing, setEditing] = useState(false);
  const [expired, setExpired] = useState(false);
  const onExpire = useCallback(() => setExpired(true), []);

  if (problem) {
    return (
      <Container sx={styles.message}>
        <Typography component="h1" sx={styles.messageTitle}>
          {problem === "missing" ? "We couldn't open this checkout" : "Something went wrong"}
        </Typography>
        <Typography sx={styles.messageText}>
          {problem === "missing"
            ? "Checkouts open only in the browser tab they started in, for your security. Please choose your room again."
            : message}
        </Typography>
        <Button variant="contained" component={Link} href={routes.home}>
          Search hotels
        </Button>
      </Container>
    );
  }

  const showForm = checkout && (checkout.status === "details" || editing);
  return (
    <Container sx={styles.page}>
      <Box sx={styles.top}>
        <Typography component="h1" sx={styles.title}>
          <LockOutlined sx={styles.lock} aria-hidden="true" />
          Secure checkout
        </Typography>
        <CheckoutSteps active={showForm || !checkout ? 0 : 1} />
      </Box>

      {!checkout ? (
        <Box sx={styles.layout} aria-busy="true">
          <Skeleton variant="rounded" height={420} sx={styles.skeleton} />
          <Skeleton variant="rounded" height={420} sx={styles.skeleton} />
        </Box>
      ) : (
        <Box sx={styles.layout}>
          <Box sx={styles.main}>
            {expired ? (
              <Alert
                severity="warning"
                action={
                  <Button color="inherit" size="small" component={Link} href={hotelHref(checkout)}>
                    Choose again
                  </Button>
                }
                sx={styles.alert}
              >
                Your price hold has ended. Rates change often, so please choose your room again for the current price.
              </Alert>
            ) : (
              <HoldTimer expiresAt={checkout.expiresAt} onExpire={onExpire} />
            )}
            {checkout.priceChange && <PriceChangeNotice change={checkout.priceChange} />}
            {showForm ? (
              <GuestDetailsForm
                checkout={checkout}
                disabled={expired}
                onSubmit={async (details) => {
                  await saveGuests(details);
                  setEditing(false);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
              />
            ) : (
              <PaymentNext checkout={checkout} onEdit={() => setEditing(true)} />
            )}
          </Box>
          <Box sx={styles.side}>
            <BookingSummary checkout={checkout} />
          </Box>
        </Box>
      )}
    </Container>
  );
}
