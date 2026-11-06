"use client";

import { useEffect, useState, type FormEvent } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import type { HotelSearchCriteria } from "@quickhotels/types/hotels";
import GuestsField from "@/components/search/HotelSearchBar/GuestsField";
import StayDatesField from "@/components/search/HotelSearchBar/StayDatesField";
import { validateCriteria, type SearchErrors } from "@/components/search/HotelSearchBar/searchCriteria";
import { styles } from "./StayBar.styles";

interface StayBarProps {
  stay: HotelSearchCriteria;
  onChange: (stay: HotelSearchCriteria) => void;
}

// Dates and guests for this hotel, and "Check availability" to reprice.
export default function StayBar({ stay, onChange }: StayBarProps) {
  const [draft, setDraft] = useState(stay);
  const [errors, setErrors] = useState<SearchErrors>({});
  useEffect(() => setDraft(stay), [stay]);

  const update = (changes: Partial<HotelSearchCriteria>) => {
    setDraft((previous) => ({ ...previous, ...changes }));
    setErrors({});
  };

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // No destination here: the hotel is the destination.
    const { destination: _destination, ...found } = validateCriteria({ ...draft, destination: "-" });
    setErrors(found);
    if (!Object.keys(found).length) onChange(draft);
  }

  const messages = Object.values(errors);
  return (
    <Box component="form" onSubmit={submit} noValidate aria-label="Your stay" sx={styles.root}>
      <Box sx={styles.fields}>
        <StayDatesField
          checkIn={draft.checkIn}
          checkOut={draft.checkOut}
          onChange={(checkIn, checkOut) => update({ checkIn, checkOut })}
          invalid={Boolean(errors.dates)}
        />
        <GuestsField
          rooms={draft.rooms}
          adults={draft.adults}
          childCount={draft.children}
          childAges={draft.childAges ?? []}
          invalid={Boolean(errors.guests)}
          onChange={(guests) => update(guests)}
        />
        <Button type="submit" variant="contained" size="large" sx={styles.submit}>
          Check availability
        </Button>
      </Box>
      {messages.length > 0 && (
        <Typography role="alert" sx={styles.error}>
          {messages.join(" ")}
        </Typography>
      )}
    </Box>
  );
}
