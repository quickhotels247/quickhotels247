"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Alert from "@mui/material/Alert";
import Badge from "@mui/material/Badge";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Drawer from "@mui/material/Drawer";
import Pagination from "@mui/material/Pagination";
import Typography from "@mui/material/Typography";
import ErrorOutlineRounded from "@mui/icons-material/ErrorOutlineRounded";
import FilterAltOffOutlined from "@mui/icons-material/FilterAltOffOutlined";
import FlightOutlined from "@mui/icons-material/FlightOutlined";
import TuneRounded from "@mui/icons-material/TuneRounded";
import type { FlightFilters, FlightOption, FlightSort } from "@quickhotels/types/flights";
import ResultsMessage from "@/components/common/ResultsMessage";
import FlightSearchBar from "@/components/search/FlightSearchBar";
import { airportByCode } from "@/components/search/FlightSearchBar/airports";
import { cabinLabels, flightCriteriaFromParams, validateFlightCriteria } from "@/components/search/FlightSearchBar/flightSearchCriteria";
import { routes } from "@/config/navigation";
import { formatShortDate } from "@/lib/dates";
import FlightCard from "../components/FlightCard";
import FlightFiltersPanel from "../components/FlightFiltersPanel";
import FlightResultsSkeleton from "../components/FlightResultsSkeleton";
import SelectionBar from "../components/SelectionBar";
import SortTabs from "../components/SortTabs";
import TripSteps from "../components/TripSteps";
import { useFlightSearch } from "../hooks/useFlightSearch";
import { loadPicks, pickProblem, savePicks, type TripPicks } from "../utils/tripPicks";
import { activeFlightFilters, filtersOfView, flightViewFromParams, PAGE_SIZE, withFlightView, type FlightView } from "../utils/flightView";
import { styles } from "./FlightResultsPage.styles";

const city = (code: string) => airportByCode(code)?.city ?? code;
const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? "" : "s"}`;

// Flight results (flights step F3): fares from TripJack per list (one-way,
// both ways in one fare, or each direction separately), with sort tabs,
// filters and pages. Choosing every direction leads to the fare check (F4).
export default function FlightResultsPage() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [filtersOpen, setFiltersOpen] = useState(false);
  // A flight picked for each list (direction), by list key.
  const [picks, setPicks] = useState<TripPicks>({});
  const listTop = useRef<HTMLDivElement>(null);

  const paramsKey = params.toString();
  const criteria = useMemo(() => flightCriteriaFromParams(params), [params]);
  const view = useMemo(() => flightViewFromParams(params), [params]);
  const problems = Object.values(validateFlightCriteria(criteria));
  const search = useFlightSearch(problems.length ? null : criteria, view);
  const { data, loading, error } = search;
  const filters = filtersOfView(view);
  const activeFilters = activeFlightFilters(filters);

  // Picks belong to one supplier search (fare ids are per search), kept for
  // the tab so Back from the fare check still shows them.
  const searchId = data?.searchId ?? null;
  useEffect(() => setPicks(searchId ? loadPicks(searchId) : {}), [searchId]);
  const choose = (next: TripPicks) => {
    setPicks(next);
    if (searchId) savePicks(searchId, next);
  };

  const show = (next: FlightView, { scroll = false } = {}) => {
    router.replace(`${pathname}?${withFlightView(new URLSearchParams(paramsKey), next)}`, { scroll: false });
    if (scroll) listTop.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  const setFilters = (next: FlightFilters) => show({ ...next, trip: view.trip, sort: view.sort, page: 1 }, { scroll: true });
  const setSort = (sort: FlightSort) => show({ ...view, sort, page: 1 });
  const setPage = (page: number) => show({ ...view, page }, { scroll: true });
  // Another direction keeps the sort but starts unfiltered (other airlines and times).
  const setTrip = (trip: string) => show({ trip, sort: view.sort, page: 1 }, { scroll: true });

  const trips = data?.trips ?? [];
  const current = data?.trip ?? view.trip ?? "";
  const separate = trips.length > 1;
  const travellers = criteria.adults + criteria.children + criteria.infants;
  const currency = data?.results[0]?.price.currency ?? "INR";

  const review = (chosen: Record<string, FlightOption>) => {
    const query = new URLSearchParams({ searchId: data!.searchId });
    trips.forEach((trip) => query.append("fare", `${trip.key}:${chosen[trip.key]!.id}`));
    router.push(`${routes.flightReview}?${query}`);
  };

  const problem = separate ? pickProblem(trips, picks) : null;

  const select = (option: FlightOption) => {
    if (!separate) return review({ [current]: option });
    const next = { ...picks, [current]: option };
    choose(next);
    // On to the next direction still to choose (unless this one clashes with another pick).
    if (pickProblem(trips, next)) return;
    const remaining = trips.find((trip) => !next[trip.key]);
    if (remaining) setTrip(remaining.key);
  };

  const summary =
    criteria.tripType === "multiCity"
      ? criteria.legs.map((leg) => city(leg.from)).concat(city(criteria.legs.at(-1)?.to ?? "")).join(" → ")
      : `${city(criteria.from)} ${criteria.tripType === "roundTrip" ? "⇄" : "→"} ${city(criteria.to)}`;
  const dates =
    criteria.tripType === "multiCity"
      ? criteria.legs.map((leg) => (leg.depart ? formatShortDate(leg.depart) : "")).join(", ")
      : [criteria.depart && formatShortDate(criteria.depart), criteria.tripType === "roundTrip" && criteria.return && formatShortDate(criteria.return)].filter(Boolean).join(" – ");

  const filterPanel = <FlightFiltersPanel facets={data?.facets ?? null} filters={filters} currency={currency} onChange={setFilters} />;

  function results() {
    if (problems.length) {
      return <ResultsMessage icon={<FlightOutlined />} title="Where are you flying?" text={`Choose your route, dates and travellers above. ${problems.join(" ")}`} />;
    }
    if (error && !data) {
      return (
        <ResultsMessage
          tone="error"
          icon={<ErrorOutlineRounded />}
          title="We couldn't load flights"
          text={error}
          action={<Button variant="contained" onClick={search.retry}>Try again</Button>}
        />
      );
    }
    if (!data) return <FlightResultsSkeleton message="Finding the best fares across airlines… this can take up to half a minute." />;
    if (!data.results.length) {
      const filtered = activeFilters > 0;
      return (
        <ResultsMessage
          icon={filtered ? <FilterAltOffOutlined /> : <FlightOutlined />}
          title={filtered ? "No flights match these filters" : "No flights found"}
          text={filtered ? "Try removing a filter or raising your price limit." : "Try other dates, a nearby airport, or allowing stops."}
          action={filtered ? <Button variant="contained" onClick={() => setFilters({})}>Clear filters</Button> : undefined}
        />
      );
    }
    const pages = Math.ceil(data.total / data.pageSize);
    return (
      <>
        {error && <Alert severity="error" action={<Button color="inherit" size="small" onClick={search.retry}>Retry</Button>} sx={styles.alert}>{error}</Alert>}
        <Box component="ol" sx={[styles.list, loading && styles.listLoading]} aria-busy={loading}>
          {data.results.map((option) => (
            <li key={option.id}>
              <FlightCard
                option={option}
                travellers={travellers}
                selected={picks[current]?.id === option.id}
                onSelect={select}
                selectLabel={separate ? "Choose" : "Select"}
              />
            </li>
          ))}
        </Box>
        {pages > 1 && (
          <Box sx={styles.pagination}>
            <Typography sx={styles.showing}>
              Showing {(data.page - 1) * PAGE_SIZE + 1}–{(data.page - 1) * PAGE_SIZE + data.results.length} of {data.total}
            </Typography>
            <Pagination page={data.page} count={pages} color="primary" shape="rounded" disabled={loading} onChange={(_, page) => setPage(page)} />
          </Box>
        )}
      </>
    );
  }

  return (
    <>
      <Box sx={styles.band}>
        <Container>
          {/* Live: trip type, dates, airports… apply as soon as the search is complete. */}
          <FlightSearchBar initialCriteria={criteria} live />
        </Container>
      </Box>

      <Container sx={styles.body}>
        <Box sx={styles.layout}>
          <Box component="aside" aria-label="Filters" sx={styles.sidebar}>
            {filterPanel}
          </Box>
          <Box sx={styles.main} ref={listTop}>
            <Box sx={styles.heading}>
              <Box>
                <Typography component="h1" sx={styles.title}>
                  {summary}
                </Typography>
                <Typography sx={styles.subtitle}>
                  {[dates, plural(travellers, "traveller"), cabinLabels[criteria.cabin]].filter(Boolean).join(" · ")}
                  {/* Each direction shows its own count in the steps below. */}
                  {data && !separate ? ` · ${data.total} ${data.total === 1 ? "flight" : "flights"}` : ""}
                </Typography>
              </Box>
              <Badge badgeContent={activeFilters} color="primary" sx={styles.filtersButton}>
                <Button variant="outlined" startIcon={<TuneRounded />} onClick={() => setFiltersOpen(true)}>
                  Filters
                </Button>
              </Badge>
            </Box>
            {separate && <TripSteps trips={trips} current={current} picked={Object.keys(picks)} onChoose={setTrip} />}
            {problem && (
              <Alert severity="warning" sx={styles.alert} action={problem.trip !== current ? <Button color="inherit" size="small" onClick={() => setTrip(problem.trip)}>Change</Button> : undefined}>
                {problem.message}
              </Alert>
            )}
            {!problems.length && <SortTabs sort={view.sort} highlights={data?.highlights ?? null} currency={currency} onSort={setSort} />}
            {results()}
          </Box>
        </Box>
      </Container>

      {separate && data && <SelectionBar trips={trips} picks={picks} blocked={Boolean(problem)} onContinue={() => review(picks)} />}

      <Drawer anchor="bottom" open={filtersOpen} onClose={() => setFiltersOpen(false)} slotProps={{ paper: { sx: styles.drawer } }}>
        <Box sx={styles.drawerBody}>{filterPanel}</Box>
        <Box sx={styles.drawerFooter}>
          <Button variant="contained" fullWidth size="large" onClick={() => setFiltersOpen(false)}>
            {data ? `Show ${data.total} flights` : "Show flights"}
          </Button>
        </Box>
      </Drawer>
    </>
  );
}
