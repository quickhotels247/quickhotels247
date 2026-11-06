import Box from "@mui/material/Box";
import type { Offer } from "../../data/types";
import SectionHeader from "@/components/common/SectionHeader";
import OfferCard from "./OfferCard";
import { styles } from "./OffersSection.styles";

interface OffersSectionProps {
  offers: Offer[];
}

// Promotions from the admin console. Hidden when none are active (spec §4.1).
export default function OffersSection({ offers }: OffersSectionProps) {
  if (!offers.length) return null;
  return (
    <Box component="section" aria-labelledby="offers">
      <SectionHeader id="offers" title="Offers" subtitle="Promotions and ideas for your next stay" />
      <Box sx={styles.grid}>
        {offers.map((offer) => (
          <OfferCard key={offer.id} offer={offer} />
        ))}
      </Box>
    </Box>
  );
}
