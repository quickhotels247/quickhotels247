"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import InputAdornment from "@mui/material/InputAdornment";
import Pagination from "@mui/material/Pagination";
import Skeleton from "@mui/material/Skeleton";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import LuggageOutlined from "@mui/icons-material/LuggageOutlined";
import SearchRounded from "@mui/icons-material/SearchRounded";
import type { BookingsTab } from "@quickhotels/types/bookings";
import RequireAuth from "@/components/auth/RequireAuth";
import { routes } from "@/config/navigation";
import { bookingsApi } from "@/lib/api/bookings";
import { useAuth } from "@/lib/auth/useAuth";
import { useApiData } from "@/lib/hooks/useApiData";
import AccountTabs from "../../components/AccountTabs";
import BookingCard from "../components/BookingCard";
import { styles } from "./MyBookingsPage.styles";

const TABS: { id: BookingsTab; label: string; empty: string }[] = [
  { id: "upcoming", label: "Upcoming", empty: "No upcoming trips yet. Where to next?" },
  { id: "past", label: "Past", empty: "Your past stays will appear here." },
  { id: "cancelled", label: "Cancelled", empty: "No cancelled bookings." },
];
// Wait for a pause in typing before searching.
const DEBOUNCE_MS = 400;

// My bookings (spec §4.7): the signed-in customer's own bookings by tab,
// with search and pages. Tab, search and page live in the URL.
export default function MyBookingsPage() {
  return (
    <RequireAuth>
      <MyBookings />
    </RequireAuth>
  );
}

function MyBookings() {
  const { token } = useAuth();
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const tab = (TABS.find((item) => item.id === params.get("tab"))?.id ?? "upcoming") as BookingsTab;
  const query = params.get("q") ?? "";
  const page = Math.max(1, Number(params.get("page")) || 1);
  const [search, setSearch] = useState(query);

  const go = (changes: Record<string, string | null>) => {
    const next = new URLSearchParams(params);
    Object.entries(changes).forEach(([key, value]) => (value ? next.set(key, value) : next.delete(key)));
    router.replace(`${pathname}${next.size ? `?${next}` : ""}`, { scroll: false });
  };

  useEffect(() => {
    if (search.trim() === query) return;
    const timer = setTimeout(() => go({ q: search.trim() || null, page: null }), DEBOUNCE_MS);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- go reads the current URL
  }, [search]);

  const { data, loading, error } = useApiData((signal) => bookingsApi.list(token!, tab, query, page, signal), [token, tab, query, page]);
  const pages = data ? Math.ceil(data.total / data.pageSize) : 0;
  const empty = TABS.find((item) => item.id === tab)!.empty;

  return (
    <Container maxWidth="md" sx={styles.root}>
      <Typography component="h1" sx={styles.title}>
        My bookings
      </Typography>
      <AccountTabs />
      <Box sx={styles.controls}>
        <Tabs value={tab} onChange={(_, value: BookingsTab) => go({ tab: value === "upcoming" ? null : value, page: null })} aria-label="Which bookings" sx={styles.tabs}>
          {TABS.map((item) => (
            <Tab key={item.id} value={item.id} label={item.label} sx={styles.tab} />
          ))}
        </Tabs>
        <TextField
          size="small"
          placeholder="Booking ref or hotel"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          slotProps={{
            htmlInput: { "aria-label": "Search bookings", maxLength: 60 },
            input: { startAdornment: <InputAdornment position="start"><SearchRounded fontSize="small" /></InputAdornment> },
          }}
          sx={styles.search}
        />
      </Box>

      {error ? (
        <Alert severity="error">{error}</Alert>
      ) : loading && !data ? (
        [0, 1].map((i) => <Skeleton key={i} variant="rounded" height={150} sx={styles.skeleton} />)
      ) : !data?.items.length ? (
        <Box sx={styles.empty}>
          <LuggageOutlined sx={styles.emptyIcon} aria-hidden="true" />
          <Typography sx={styles.emptyText}>{query ? `No bookings match "${query}".` : empty}</Typography>
          {!query && tab === "upcoming" && (
            <Button variant="contained" component={Link} href={routes.home}>
              Search hotels
            </Button>
          )}
        </Box>
      ) : (
        <Box component="ul" sx={[styles.list, loading && styles.loading]}>
          {data.items.map((booking) => (
            <li key={booking.reference}>
              <BookingCard booking={booking} />
            </li>
          ))}
        </Box>
      )}

      {pages > 1 && (
        <Pagination page={page} count={pages} color="primary" shape="rounded" onChange={(_, value) => go({ page: value > 1 ? String(value) : null })} sx={styles.pagination} />
      )}
    </Container>
  );
}
