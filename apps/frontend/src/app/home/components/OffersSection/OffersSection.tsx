"use client";

import Box from "@mui/material/Box";
import type { PublicOffer } from "@quickhotels/types/coupons";
import SectionHeader from "@/components/common/SectionHeader";
import { routes } from "@/config/navigation";
import { offersApi } from "@/lib/api/offers";
import { formatPrice } from "@/lib/format";
import { useApiData } from "@/lib/hooks/useApiData";
import { homeImages } from "../../data/images";
import type { Offer } from "../../data/types";
import OfferCard from "./OfferCard";
import { styles } from "./OffersSection.styles";

const IMAGES = [homeImages.beachHut, homeImages.spa, homeImages.hero];
const day = (iso: string) => new Date(`${iso}T00:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "short" });

// A public coupon as a Home offer card: what it gives, its terms, the code.
function toOffer(offer: PublicOffer, index: number): Offer {
  const amount = offer.discountType === "PERCENTAGE" ? `${offer.value}% off` : `${formatPrice({ amount: offer.value, currency: "INR" })} off`;
  const terms = [
    offer.maxDiscount && offer.discountType === "PERCENTAGE" ? `up to ${formatPrice({ amount: offer.maxDiscount, currency: "INR" })}` : null,
    offer.minBookingAmount ? `on bookings over ${formatPrice({ amount: offer.minBookingAmount, currency: "INR" })}` : null,
    offer.eligibleDestinations.length ? `in ${offer.eligibleDestinations.join(", ")}` : null,
    `until ${day(offer.validTo)}`,
  ].filter(Boolean);
  const flights = offer.product === "FLIGHT";
  return {
    id: offer.code,
    title: offer.title,
    description: `${offer.description ? `${offer.description} ` : ""}${amount} ${terms.join(", ")}. Use code ${offer.code} at checkout.`,
    ctaLabel: flights ? "Find flights" : "Find stays",
    href:
      !flights && offer.eligibleDestinations.length === 1
        ? `${routes.hotels}?${new URLSearchParams({ destination: offer.eligibleDestinations[0]! })}`
        : flights
          ? routes.flights
          : routes.home,
    imageUrl: IMAGES[index % IMAGES.length]!,
  };
}

// Public coupons from the admin console. Hidden when none are active (spec §4.1).
export default function OffersSection() {
  const { data } = useApiData((signal) => offersApi.list(signal), []);
  if (!data?.length) return null;
  return (
    <Box component="section" aria-labelledby="offers">
      <SectionHeader id="offers" title="Offers" subtitle="Coupon codes you can use at checkout" />
      <Box sx={styles.grid}>
        {data.map((offer, i) => (
          <OfferCard key={offer.code} offer={toOffer(offer, i)} />
        ))}
      </Box>
    </Box>
  );
}
