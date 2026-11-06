"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import SearchRounded from "@mui/icons-material/SearchRounded";
import type { HotelSearchCriteria } from "@quickhotels/types/hotels";
import { defaultStay } from "@/config/searchDefaults";
import { saveRecentSearch } from "@/lib/recentSearches";
import DestinationField from "./DestinationField";
import GuestsField from "./GuestsField";
import StayDatesField from "./StayDatesField";
import { emptyCriteria, searchUrl, validateCriteria, type SearchErrors } from "./searchCriteria";
import { styles } from "./HotelSearchBar.styles";

interface HotelSearchBarProps {
  initialCriteria?: HotelSearchCriteria;
  // On the results page: new dates and guests (and a destination picked from
  // the suggestions) apply by themselves, so the bar and the results agree.
  // A typed destination waits for Search.
  live?: boolean;
}

// How long to wait after the last change before searching (guests +/−).
const LIVE_DELAY_MS = 700;

// Destination, stay dates and guests, then "Search Hotels". One row from
// tablet up; stacked fields on phones.
export default function HotelSearchBar({ initialCriteria = emptyCriteria, live = false }: HotelSearchBarProps) {
  const router = useRouter();
  const [criteria, setCriteria] = useState(initialCriteria);
  const [errors, setErrors] = useState<SearchErrors>({});
  // The destination last chosen from the suggestions.
  const [picked, setPicked] = useState<string | null>(null);
  const update = (changes: Partial<HotelSearchCriteria>) => {
    setCriteria((previous) => ({ ...previous, ...changes }));
    setErrors({});
  };
  const clean = { ...criteria, destination: criteria.destination.trim() };
  // Compared as URLs (one canonical form of the criteria).
  const appliedUrl = searchUrl(initialCriteria);
  const draftUrl = searchUrl(clean);
  const changed = draftUrl !== appliedUrl;
  const complete = Object.keys(validateCriteria(clean)).length === 0;
  const destinationReady = clean.destination === initialCriteria.destination.trim() || clean.destination === picked;

  // The URL changed (a new search, Back/Forward): show its criteria.
  useEffect(() => {
    if (!live) return;
    setCriteria(initialCriteria);
    setErrors({});
    // appliedUrl stands for initialCriteria.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appliedUrl, live]);

  useEffect(() => {
    if (!live || !changed || !complete || !destinationReady) return;
    const timer = setTimeout(() => {
      saveRecentSearch(clean);
      router.push(draftUrl, { scroll: false });
    }, LIVE_DELAY_MS);
    return () => clearTimeout(timer);
    // draftUrl stands for clean.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [live, changed, complete, destinationReady, draftUrl, router]);

  // Start with the default stay (today → tomorrow unless .env.local says
  // otherwise). Done after mount so the server and browser agree on "today".
  useEffect(() => {
    setCriteria((previous) => (previous.checkIn || previous.checkOut ? previous : { ...previous, ...defaultStay() }));
  }, []);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const found = validateCriteria(criteria);
    setErrors(found);
    if (Object.keys(found).length) return;
    saveRecentSearch(clean);
    router.push(draftUrl, { scroll: !live });
  }

  const messages = Object.values(errors);
  return (
    <Box component="form" role="search" aria-label="Search hotels" onSubmit={submit} noValidate sx={styles.root}>
      <Box sx={styles.fields}>
        <DestinationField
          value={criteria.destination}
          onChange={(destination) => update({ destination })}
          onPick={setPicked}
          invalid={Boolean(errors.destination)}
        />
        <StayDatesField
          checkIn={criteria.checkIn}
          checkOut={criteria.checkOut}
          onChange={(checkIn, checkOut) => update({ checkIn, checkOut })}
          invalid={Boolean(errors.dates)}
        />
        <GuestsField
          rooms={criteria.rooms}
          adults={criteria.adults}
          childCount={criteria.children}
          childAges={criteria.childAges ?? []}
          invalid={Boolean(errors.guests)}
          onChange={(guests) => update(guests)}
        />
        <Button type="submit" variant="contained" size="large" startIcon={<SearchRounded />} sx={styles.submit}>
          Search Hotels
        </Button>
      </Box>
      {messages.length > 0 && (
        <Typography role="alert" sx={styles.error}>
          {messages.join(" ")}
        </Typography>
      )}
      {live && changed && messages.length === 0 && (!complete || !destinationReady) && (
        <Typography role="status" sx={styles.pending}>
          {complete ? "Press Search Hotels to see results for the new destination." : "Finish your search above to update the results below."}
        </Typography>
      )}
    </Box>
  );
}
