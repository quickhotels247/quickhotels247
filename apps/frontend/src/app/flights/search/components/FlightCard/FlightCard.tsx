"use client";

import { useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import Chip from "@mui/material/Chip";
import Typography from "@mui/material/Typography";
import ExpandMoreRounded from "@mui/icons-material/ExpandMoreRounded";
import LuggageOutlined from "@mui/icons-material/LuggageOutlined";
import type { FlightOption } from "@quickhotels/types/flights";
import { formatPrice } from "@/lib/format";
import FlightDetails from "./FlightDetails";
import JourneyRow from "@/components/flight/JourneyRow";
import { styles } from "./FlightCard.styles";

interface FlightCardProps {
  option: FlightOption;
  travellers: number;
  selected: boolean;
  onSelect: (option: FlightOption) => void;
  selectLabel: string;
}

const REFUND = { REFUNDABLE: "Refundable", PARTIALLY_REFUNDABLE: "Partly refundable", NON_REFUNDABLE: "Non-refundable" } as const;

// A fare: its journeys, then the price for everyone, what's included,
// "Select", and the full flight details on demand.
export default function FlightCard({ option, travellers, selected, onSelect, selectLabel }: FlightCardProps) {
  const [open, setOpen] = useState(false);
  return (
    <Card component="article" sx={[styles.root, selected && styles.selected]}>
      <Box sx={styles.main}>
        <Box sx={styles.journeys}>
          {option.legs.map((journey, i) => (
            <JourneyRow key={i} journey={journey} />
          ))}
          <Box sx={styles.tags}>
            {option.baggage.checkIn && <Chip icon={<LuggageOutlined />} label={`${option.baggage.checkIn} check-in`} size="small" variant="outlined" sx={styles.tag} />}
            <Chip
              label={REFUND[option.refundable]}
              size="small"
              variant="outlined"
              color={option.refundable === "NON_REFUNDABLE" ? "default" : "success"}
              sx={styles.tag}
            />
            {option.seatsLeft !== null && option.seatsLeft <= 5 && <Chip label={`${option.seatsLeft} ${option.seatsLeft === 1 ? "seat" : "seats"} left`} size="small" color="warning" sx={styles.tag} />}
          </Box>
        </Box>
        <Box sx={styles.side}>
          <Typography sx={styles.price}>{formatPrice(option.price)}</Typography>
          <Typography sx={styles.priceNote}>
            {travellers > 1 ? `${formatPrice(option.pricePerAdult)} per adult · ` : ""}incl. taxes & fees
          </Typography>
          <Button variant={selected ? "outlined" : "contained"} onClick={() => onSelect(option)} sx={styles.select} aria-pressed={selected}>
            {selected ? "Selected" : selectLabel}
          </Button>
        </Box>
      </Box>
      <Button
        size="small"
        onClick={() => setOpen((value) => !value)}
        endIcon={<ExpandMoreRounded sx={[styles.chevron, open && styles.chevronOpen]} />}
        aria-expanded={open}
        sx={styles.toggle}
      >
        {open ? "Hide flight details" : "Flight details"}
      </Button>
      {open && <FlightDetails option={option} />}
    </Card>
  );
}
