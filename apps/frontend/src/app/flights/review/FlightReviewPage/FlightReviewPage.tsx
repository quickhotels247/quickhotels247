"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Skeleton from "@mui/material/Skeleton";
import Typography from "@mui/material/Typography";
import LockOutlined from "@mui/icons-material/LockOutlined";
import HoldTimer from "@/components/common/HoldTimer";
import PriceChangeNotice from "@/components/common/PriceChangeNotice";
import { airportByCode } from "@/components/search/FlightSearchBar/airports";
import { flightSearchUrl } from "@/components/search/FlightSearchBar/flightSearchCriteria";
import { routes } from "@/config/navigation";
import BookingSteps from "../components/BookingSteps";
import CouponBox from "@/components/booking/CouponBox";
import FarePriceCard from "../components/FarePriceCard";
import FareRulesCard from "../components/FareRulesCard";
import ItineraryCard from "../components/ItineraryCard";
import PaymentStep from "../components/PaymentStep";
import TravellerNeedsCard from "../components/TravellerNeedsCard";
import TravellersForm from "../components/TravellersForm";
import TripSummaryCard from "../components/TripSummaryCard";
import { useFlightReview } from "../hooks/useFlightReview";
import { styles } from "./FlightReviewPage.styles";

const city = (code: string) => airportByCode(code)?.city ?? code;

// Booking a flight, one step at a time on one page: the fare as the airline
// confirmed it with its rules and price (F4), the travellers (F5), then
// payment (F6). The price is held for a short time throughout.
export default function FlightReviewPage() {
  const { reviewId } = useParams<{ reviewId: string }>();
  const { review, problem, message, saveTravellers, applyCoupon, removeCoupon } = useFlightReview(reviewId);
  const [expired, setExpired] = useState(false);
  const onExpire = useCallback(() => setExpired(true), []);
  // 0 review fare, 1 travellers, 2 payment.
  const [step, setStep] = useState(0);
  const status = review?.status;
  // Travellers already saved (e.g. after a reload): go to payment.
  useEffect(() => {
    if (status === "payment") setStep(2);
  }, [status]);
  const goTo = (next: number) => {
    setStep(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (problem) {
    return (
      <Container sx={styles.message}>
        <Typography component="h1" sx={styles.messageTitle}>
          {problem === "missing" ? "We couldn't open this booking" : "Something went wrong"}
        </Typography>
        <Typography sx={styles.messageText}>
          {problem === "missing" ? "Bookings open only in the browser tab they started in, for your security. Please choose your flights again." : message}
        </Typography>
        <Button variant="contained" component={Link} href={routes.flights}>
          Search flights
        </Button>
      </Container>
    );
  }

  const { criteria } = review ?? {};
  const route = criteria
    ? criteria.tripType === "multiCity"
      ? criteria.legs.map((leg) => city(leg.from)).concat(city(criteria.legs.at(-1)?.to ?? "")).join(" → ")
      : `${city(criteria.from)} ${criteria.tripType === "roundTrip" ? "⇄" : "→"} ${city(criteria.to)}`
    : "";

  return (
    <Container sx={styles.page}>
      <Box sx={styles.top}>
        <Typography component="h1" sx={styles.title}>
          <LockOutlined sx={styles.lock} aria-hidden="true" />
          {review ? route : "Review your flights"}
        </Typography>
        <BookingSteps active={step} />
      </Box>

      {!review ? (
        <Box sx={styles.layout} aria-busy="true">
          <Skeleton variant="rounded" height={420} sx={styles.skeleton} />
          <Skeleton variant="rounded" height={300} sx={styles.skeleton} />
        </Box>
      ) : (
        <Box sx={styles.layout}>
          <Box sx={styles.main}>
            {expired ? (
              <Alert
                severity="warning"
                action={
                  <Button color="inherit" size="small" component={Link} href={flightSearchUrl(review.criteria)}>
                    Search again
                  </Button>
                }
                sx={styles.alert}
              >
                The airline&apos;s price hold has ended. Fares change often, so please search again for the current price.
              </Alert>
            ) : (
              <HoldTimer expiresAt={review.expiresAt} onExpire={onExpire} />
            )}
            {review.priceChange && <PriceChangeNotice change={review.priceChange} />}
            {step === 0 && (
              <>
                <ItineraryCard review={review} />
                <FareRulesCard rules={review.rules} />
              </>
            )}
            {step === 1 && (
              <TravellersForm
                review={review}
                disabled={expired}
                onBack={() => goTo(0)}
                onSubmit={async (details) => {
                  await saveTravellers(details);
                  goTo(2);
                }}
              />
            )}
            {step === 2 && <PaymentStep review={review} onEdit={() => goTo(1)} />}
          </Box>
          <Box sx={styles.side}>
            <FarePriceCard price={review.price} coupon={review.coupon} payable={review.payable}>
              <CouponBox coupon={review.coupon} onApply={applyCoupon} onRemove={removeCoupon} />
            </FarePriceCard>
            {step === 0 && (
              <>
                <TravellerNeedsCard requirements={review.requirements} />
                <Button variant="contained" size="large" fullWidth disabled={expired} onClick={() => goTo(1)}>
                  Continue to traveller details
                </Button>
              </>
            )}
            {step > 0 && <TripSummaryCard review={review} />}
          </Box>
        </Box>
      )}
    </Container>
  );
}
