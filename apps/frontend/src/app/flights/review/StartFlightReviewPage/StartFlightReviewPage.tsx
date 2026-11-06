"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import type { FlightReviewSummary } from "@quickhotels/types/flight-checkout";
import { routes } from "@/config/navigation";
import { ApiError } from "@/lib/api/client";
import { flightReviewsApi } from "@/lib/api/flightReviews";
import { rememberCheckout, startKey } from "@/lib/checkoutKeys";
import { styles } from "./StartFlightReviewPage.styles";

// Reviews in progress, by key. React runs effects twice in development, and
// a review must not be sent twice, so the second run reuses the first.
const starting = new Map<string, Promise<FlightReviewSummary>>();

function startOnce(searchId: string, fares: { trip: string; id: string }[], key: string) {
  let start = starting.get(key);
  if (!start) {
    start = flightReviewsApi.create({ searchId, fares }, key);
    starting.set(key, start);
    start.catch(() => {}).finally(() => starting.delete(key));
  }
  return start;
}

// Where "Select" / "Continue" on the results lands: confirms the chosen
// fares with the airline, then moves to the review's own address.
// ?searchId=…&fare=ONWARD:<id>&fare=RETURN:<id>
export default function StartFlightReviewPage() {
  const params = useSearchParams();
  const router = useRouter();
  const [error, setError] = useState<{ title: string; text: string; retry: boolean } | null>(null);
  const [attempt, setAttempt] = useState(0);
  const searchId = params.get("searchId");
  const fareParams = params.getAll("fare");

  useEffect(() => {
    const fares = fareParams.flatMap((value) => {
      const split = value.indexOf(":");
      return split > 0 ? [{ trip: value.slice(0, split), id: value.slice(split + 1) }] : [];
    });
    if (!searchId || !fares.length) {
      setError({ title: "Choose your flights first", text: "Pick your flights on the results page to continue.", retry: false });
      return;
    }
    let active = true;
    const key = startKey("flight", searchId, ...fares.map((fare) => fare.id));
    setError(null);
    startOnce(searchId, fares, key)
      .then((review) => {
        rememberCheckout(review.reviewId, key);
        if (active) router.replace(`${routes.flightReview}/${review.reviewId}`);
      })
      .catch((caught: Error) => {
        if (!active) return;
        const status = caught instanceof ApiError ? caught.status : 0;
        setError({
          title: status === 409 ? "Those seats just sold out" : status === 410 ? "These fares have expired" : "We couldn't confirm this fare",
          text: caught.message,
          retry: ![400, 404, 409, 410].includes(status),
        });
      });
    return () => {
      active = false;
    };
    // fareParams is read from params, which searchId and the joined fares stand for.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchId, fareParams.join("|"), router, attempt]);

  return (
    <Container sx={styles.root}>
      {error ? (
        <Box role="alert">
          <Typography component="h1" sx={styles.title}>
            {error.title}
          </Typography>
          <Typography sx={styles.text}>{error.text}</Typography>
          <Box sx={styles.actions}>
            {error.retry && (
              <Button variant="contained" onClick={() => setAttempt((n) => n + 1)}>
                Try again
              </Button>
            )}
            <Button variant={error.retry ? "outlined" : "contained"} onClick={() => (window.history.length > 1 ? router.back() : router.push(routes.flights))}>
              Back to flights
            </Button>
            <Button component={Link} href={routes.flights} variant="text">
              New search
            </Button>
          </Box>
        </Box>
      ) : (
        <Box role="status" sx={styles.waiting}>
          <CircularProgress />
          <Typography component="h1" sx={styles.title}>
            Confirming your fare with the airline…
          </Typography>
          <Typography sx={styles.text}>We&apos;re checking the latest price, seats and fare rules. This takes a few seconds.</Typography>
        </Box>
      )}
    </Container>
  );
}
