"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Drawer from "@mui/material/Drawer";
import ErrorOutlineRounded from "@mui/icons-material/ErrorOutlineRounded";
import FilterAltOffOutlined from "@mui/icons-material/FilterAltOffOutlined";
import TravelExploreRounded from "@mui/icons-material/TravelExploreRounded";
import type { HotelFilters, HotelSort } from "@quickhotels/types/hotels";
import HotelSearchBar from "@/components/search/HotelSearchBar";
import { criteriaFromParams, validateCriteria } from "@/components/search/HotelSearchBar/searchCriteria";
import { routes } from "@/config/navigation";
import FiltersPanel from "../components/FiltersPanel";
import HotelResultCard from "../components/HotelResultCard";
import ResultsHeader from "../components/ResultsHeader";
import ResultsMessage from "@/components/common/ResultsMessage";
import ResultsPagination from "../components/ResultsPagination";
import ResultsSkeleton from "../components/ResultsSkeleton";
import { useHotelSearch } from "../hooks/useHotelSearch";
import { activeFilterCount, filtersOf, PAGE_SIZE, viewFromParams, withView, type SearchView } from "../utils/searchView";
import { styles } from "./SearchResultsPage.styles";

// Hotel search results (spec §4.2), laid out like a large OTA: the search bar
// to change the stay, filters on the left (a drawer on smaller screens), and
// hotels with live prices page by page. Criteria, page, order and filters all
// live in the URL.
export default function SearchResultsPage() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const listTop = useRef<HTMLDivElement>(null);

  const paramsKey = params.toString();
  const criteria = useMemo(() => criteriaFromParams(params), [params]);
  const view = useMemo(() => viewFromParams(params), [params]);
  const problems = Object.values(validateCriteria(criteria));
  const search = useHotelSearch(problems.length ? null : criteria, view);
  const { data, loading, error } = search;
  const filters = filtersOf(view);
  const activeFilters = activeFilterCount(filters);
  // "Hyderabad" from "Hyderabad, India" (suggestions add the country).
  const place = criteria.destination.split(",")[0]!.trim();

  // Links without dates (e.g. a destination card) search the default stay;
  // put those dates in the URL so it can be refreshed and shared as shown.
  useEffect(() => {
    const current = new URLSearchParams(paramsKey);
    if (!criteria.destination || (current.get("checkIn") === criteria.checkIn && current.get("checkOut") === criteria.checkOut)) return;
    current.set("checkIn", criteria.checkIn);
    current.set("checkOut", criteria.checkOut);
    router.replace(`${pathname}?${current}`, { scroll: false });
  }, [paramsKey, criteria.destination, criteria.checkIn, criteria.checkOut, pathname, router]);

  const show = (next: SearchView, { scroll = false } = {}) => {
    router.replace(`${pathname}?${withView(new URLSearchParams(paramsKey), next)}`, { scroll: false });
    if (scroll) listTop.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  // Replaces every filter (an empty object clears them all).
  const setFilters = (next: HotelFilters) => show({ ...next, sort: view.sort, page: 1 }, { scroll: true });
  const setSort = (sort: HotelSort) => show({ ...view, sort, page: 1 });
  const setPage = (page: number) => show({ ...view, page }, { scroll: true });
  const clearFilters = () => setFilters({});

  const filterPanel = (
    <FiltersPanel
      facets={data?.facets ?? null}
      filters={filters}
      centre={data?.centre ?? null}
      currency={data?.results[0]?.totalPrice.currency ?? "INR"}
      onChange={(next) => setFilters({ ...next, stars: next.stars?.length ? next.stars : undefined })}
    />
  );

  function results() {
    if (problems.length) {
      return (
        <ResultsMessage
          icon={<TravelExploreRounded />}
          title="Where would you like to stay?"
          text={`Enter your destination, dates and guests above to see hotels and prices. ${problems.join(" ")}`}
        />
      );
    }
    if (error && !data) {
      return (
        <ResultsMessage
          tone="error"
          icon={<ErrorOutlineRounded />}
          title="We couldn't load hotels"
          text={error}
          action={<Button variant="contained" onClick={search.retry}>Try again</Button>}
        />
      );
    }
    if (!data) return <ResultsSkeleton message={`Finding the best prices in ${place}…`} />;
    if (!data.results.length) {
      const filtered = activeFilters > 0;
      return (
        <ResultsMessage
          icon={filtered ? <FilterAltOffOutlined /> : <TravelExploreRounded />}
          title={filtered ? "No hotels match these filters" : view.page > 1 ? "No more hotels" : `No hotels available in ${place}`}
          text={
            filtered
              ? "Try removing a filter or widening your budget."
              : view.page > 1
                ? "That's every hotel we found for these dates."
                : "Try different dates, fewer rooms, or a nearby city."
          }
          action={
            filtered ? (
              <Button variant="contained" onClick={clearFilters}>Clear filters</Button>
            ) : view.page > 1 ? (
              <Button variant="contained" onClick={() => setPage(1)}>Back to page 1</Button>
            ) : (
              <Button variant="outlined" component={Link} href={routes.home}>Search again</Button>
            )
          }
        />
      );
    }
    return (
      <>
        {error && (
          <Alert severity="error" action={<Button color="inherit" size="small" onClick={search.retry}>Retry</Button>} sx={styles.alert}>
            {error}
          </Alert>
        )}
        <Box component="ol" sx={[styles.list, loading && styles.listLoading]} aria-busy={loading}>
          {data.results.map((hotel) => (
            <Box component="li" key={hotel.id}>
              <HotelResultCard hotel={hotel} criteria={criteria} nights={data.nights} centre={data.centre} searchId={data.searchId} />
            </Box>
          ))}
        </Box>
        <ResultsPagination
          page={view.page}
          pageSize={PAGE_SIZE}
          total={data.total}
          complete={data.complete}
          shown={data.results.length}
          disabled={loading}
          onChange={setPage}
        />
      </>
    );
  }

  return (
    <>
      <Box sx={styles.searchBand}>
        <Container>
          {/* Live: new dates, guests or a picked destination apply by themselves. */}
          <HotelSearchBar initialCriteria={criteria} live />
        </Container>
      </Box>

      <Container sx={styles.body}>
        {data?.sample && (
          <Alert severity="warning" sx={styles.alert}>
            These are sample hotels for testing, not live TripJack prices.
          </Alert>
        )}
        <Box sx={styles.layout}>
          <Box component="aside" aria-label="Filters" sx={styles.sidebar}>
            {filterPanel}
          </Box>
          <Box sx={styles.main} ref={listTop}>
            <ResultsHeader
              destination={place || "Hotels"}
              found={data && !problems.length ? { total: data.total, complete: data.complete } : null}
              sort={view.sort}
              centre={data?.centre ?? null}
              activeFilters={activeFilters}
              onSort={setSort}
              onOpenFilters={() => setFiltersOpen(true)}
            />
            {results()}
          </Box>
        </Box>
      </Container>

      <Drawer anchor="bottom" open={filtersOpen} onClose={() => setFiltersOpen(false)} slotProps={{ paper: { sx: styles.drawer } }}>
        <Box sx={styles.drawerBody}>{filterPanel}</Box>
        <Box sx={styles.drawerFooter}>
          <Button variant="contained" fullWidth size="large" onClick={() => setFiltersOpen(false)}>
            {data ? `Show ${data.total}${data.complete ? "" : "+"} hotels` : "Show hotels"}
          </Button>
        </Box>
      </Drawer>
    </>
  );
}
