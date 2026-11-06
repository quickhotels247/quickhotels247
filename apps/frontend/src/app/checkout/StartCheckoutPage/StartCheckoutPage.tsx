"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import { routes } from "@/config/navigation";
import { ApiError } from "@/lib/api/client";
import { checkoutApi } from "@/lib/api/checkout";
import type { CheckoutSummary } from "@quickhotels/types/checkout";
import { rememberCheckout, startKey } from "@/lib/checkoutKeys";
import { styles } from "./StartCheckoutPage.styles";

// Starts in progress, by key. React runs effects twice in development, and
// a checkout start must not be sent twice, so the second run reuses the first.
const starting = new Map<string, Promise<CheckoutSummary>>();

function startOnce(roomsId: string, optionId: string, key: string) {
  let start = starting.get(key);
  if (!start) {
    start = checkoutApi.create({ roomsId, optionId }, key);
    starting.set(key, start);
    // Forget it when settled, so "Try again" sends a fresh request.
    start.catch(() => {}).finally(() => starting.delete(key));
  }
  return start;
}

// Where "Reserve" lands: confirms the chosen rate with the supplier, then
// moves to the checkout's own address. Errors offer a way back to the hotel.
export default function StartCheckoutPage() {
  const params = useSearchParams();
  const router = useRouter();
  const [error, setError] = useState<{ title: string; text: string; retry: boolean } | null>(null);
  const [attempt, setAttempt] = useState(0);
  const roomsId = params.get("roomsId");
  const optionId = params.get("optionId");
  const hotelId = params.get("hotelId");

  // Back to the hotel with the same stay (the checkout's own params removed).
  const hotelHref = (() => {
    if (!hotelId) return routes.home;
    const stay = new URLSearchParams(params);
    ["roomsId", "optionId", "hotelId"].forEach((key) => stay.delete(key));
    return `/hotels/${encodeURIComponent(hotelId)}?${stay}`;
  })();

  useEffect(() => {
    if (!roomsId || !optionId) {
      setError({ title: "Choose a room first", text: "Pick a room and rate on the hotel page to start booking.", retry: false });
      return;
    }
    // Not aborted on unmount: the request must finish once sent; a later
    // run (or "Try again") picks up its result.
    let active = true;
    const key = startKey(roomsId, optionId);
    setError(null);
    startOnce(roomsId, optionId, key)
      .then((checkout) => {
        rememberCheckout(checkout.checkoutId, key);
        if (active) router.replace(`${routes.checkout}/${checkout.checkoutId}`);
      })
      .catch((caught: Error) => {
        if (!active) return;
        const status = caught instanceof ApiError ? caught.status : 0;
        setError({
          title: status === 409 ? "This room just sold out" : status === 410 ? "These prices have expired" : "We couldn't confirm this room",
          text: caught.message,
          // Sold out, expired or unknown rates need a new choice; the rest may pass.
          retry: ![400, 404, 409, 410].includes(status),
        });
      });
    return () => {
      active = false;
    };
  }, [roomsId, optionId, router, attempt]);

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
            <Button variant={error.retry ? "outlined" : "contained"} component={Link} href={hotelHref}>
              Back to the hotel
            </Button>
          </Box>
        </Box>
      ) : (
        <Box role="status" sx={styles.waiting}>
          <CircularProgress />
          <Typography component="h1" sx={styles.title}>
            Confirming your room with the hotel…
          </Typography>
          <Typography sx={styles.text}>We&apos;re checking the latest price and availability. This takes a few seconds.</Typography>
        </Box>
      )}
    </Container>
  );
}
