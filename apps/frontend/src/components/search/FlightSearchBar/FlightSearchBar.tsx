"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import Typography from "@mui/material/Typography";
import FlightLandRounded from "@mui/icons-material/FlightLandRounded";
import FlightTakeoffRounded from "@mui/icons-material/FlightTakeoffRounded";
import SearchRounded from "@mui/icons-material/SearchRounded";
import type { FlightSearchCriteria, TripType } from "@quickhotels/types/flights";
import AirportField from "./AirportField";
import CabinClassSelect from "./CabinClassSelect";
import FlightDatesField from "./FlightDatesField";
import MultiCityLegs from "./MultiCityLegs";
import SwapAirportsButton from "./SwapAirportsButton";
import TravellersField from "./TravellersField";
import TripTypeTabs from "./TripTypeTabs";
import {
  emptyFlightCriteria,
  flightSearchUrl,
  validateFlightCriteria,
  type FlightSearchErrors,
} from "./flightSearchCriteria";
import { styles } from "./FlightSearchBar.styles";

interface FlightSearchBarProps {
  initialCriteria?: FlightSearchCriteria;
  // On the results page: changes apply by themselves once the search is
  // complete (trip type, dates, airports…), so the bar and the results never
  // disagree. Search still applies at once.
  live?: boolean;
}

// How long to wait after the last change before searching (travellers +/−).
const LIVE_DELAY_MS = 700;

// Trip type, cabin class and "direct only" on top; then From ⇄ To, dates,
// travellers and Search (one row on desktop, stacked on phones). Multi-city
// shows a row per flight, then travellers and Search.
export default function FlightSearchBar({ initialCriteria = emptyFlightCriteria, live = false }: FlightSearchBarProps) {
  const router = useRouter();
  const [criteria, setCriteria] = useState(initialCriteria);
  const [errors, setErrors] = useState<FlightSearchErrors>({});
  // Bumped to open the calendar, e.g. after switching to round trip.
  const [openDates, setOpenDates] = useState(0);
  // Compared as URLs, which ignore fields the trip type doesn't use.
  const appliedUrl = flightSearchUrl(initialCriteria);
  const draftUrl = flightSearchUrl(criteria);
  const changed = draftUrl !== appliedUrl;
  const complete = Object.keys(validateFlightCriteria(criteria)).length === 0;

  // The URL changed (a new search, Back/Forward): show its criteria.
  useEffect(() => {
    setCriteria(initialCriteria);
    setErrors({});
    // appliedUrl stands for initialCriteria.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appliedUrl]);

  useEffect(() => {
    if (!live || !changed || !complete) return;
    const timer = setTimeout(() => router.push(draftUrl, { scroll: false }), LIVE_DELAY_MS);
    return () => clearTimeout(timer);
  }, [live, changed, complete, draftUrl, router]);
  const update = (changes: Partial<FlightSearchCriteria>) => {
    setCriteria((previous) => ({ ...previous, ...changes }));
    setErrors({});
  };

  function changeTripType(tripType: TripType) {
    if (tripType === "multiCity") {
      // Carry what's already filled in over as the first flight.
      const [first, ...rest] = criteria.legs;
      const filled = { from: criteria.from || first.from, to: criteria.to || first.to, depart: criteria.depart || first.depart };
      update({ tripType, legs: [filled, ...rest] });
    } else {
      // Coming from multi-city: start from its first flight.
      const first = criteria.tripType === "multiCity" ? criteria.legs[0] : null;
      const route = first ? { from: criteria.from || first.from, to: criteria.to || first.to, depart: criteria.depart || first.depart } : {};
      update({ tripType, ...route, return: tripType === "oneWay" ? "" : criteria.return });
      // A round trip needs a return date: open the calendar for it.
      if (tripType === "roundTrip" && !criteria.return) setOpenDates((n) => n + 1);
    }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const found = validateFlightCriteria(criteria);
    setErrors(found);
    if (Object.keys(found).length) return;
    router.push(draftUrl, { scroll: !live });
  }

  const multiCity = criteria.tripType === "multiCity";
  const travellersAndSearch = (
    <>
      <TravellersField
        adults={criteria.adults}
        childCount={criteria.children}
        infants={criteria.infants}
        onChange={(travellers) => update(travellers)}
        invalid={Boolean(errors.travellers)}
      />
      <Button type="submit" variant="contained" size="large" startIcon={<SearchRounded />} sx={styles.submit}>
        Search
      </Button>
    </>
  );

  const messages = Object.values(errors);
  return (
    <Box component="form" role="search" aria-label="Search flights" onSubmit={submit} noValidate sx={styles.root}>
      <Box sx={styles.options}>
        <TripTypeTabs value={criteria.tripType} onChange={changeTripType} />
        <CabinClassSelect value={criteria.cabin} onChange={(cabin) => update({ cabin })} />
        <FormControlLabel
          control={<Checkbox size="small" checked={criteria.directOnly} onChange={(event) => update({ directOnly: event.target.checked })} />}
          label="Direct flights only"
          sx={styles.direct}
        />
      </Box>
      {multiCity && (
        <>
          <MultiCityLegs
            legs={criteria.legs}
            onChange={(legs) => update({ legs })}
            invalidRoute={Boolean(errors.route)}
            invalidDates={Boolean(errors.dates)}
          />
          <Box sx={styles.multiFooter}>{travellersAndSearch}</Box>
        </>
      )}
      {!multiCity && (
        <Box sx={styles.fields}>
          <AirportField
            label="Leaving from"
            icon={<FlightTakeoffRounded />}
            value={criteria.from}
            onChange={(from) => update({ from })}
            invalid={Boolean(errors.route)}
          />
          <SwapAirportsButton onSwap={() => update({ from: criteria.to, to: criteria.from })} />
          <AirportField
            label="Going to"
            icon={<FlightLandRounded />}
            value={criteria.to}
            onChange={(to) => update({ to })}
            invalid={Boolean(errors.route)}
          />
          <FlightDatesField
            tripType={criteria.tripType}
            depart={criteria.depart}
            returnDate={criteria.return}
            onChange={(depart, returnDate) => update({ depart, return: returnDate })}
            invalid={Boolean(errors.dates)}
            openSignal={openDates}
          />
          {travellersAndSearch}
        </Box>
      )}
      {messages.length > 0 && (
        <Typography role="alert" sx={styles.error}>
          {messages.join(" ")}
        </Typography>
      )}
      {live && changed && !complete && messages.length === 0 && (
        <Typography role="status" sx={styles.pending}>
          Finish your search above to update the results below.
        </Typography>
      )}
    </Box>
  );
}
