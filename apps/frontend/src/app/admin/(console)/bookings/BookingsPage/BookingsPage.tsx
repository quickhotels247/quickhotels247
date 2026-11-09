"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import InputAdornment from "@mui/material/InputAdornment";
import Pagination from "@mui/material/Pagination";
import Skeleton from "@mui/material/Skeleton";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import SearchRounded from "@mui/icons-material/SearchRounded";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { FlightStatusChip } from "@/components/admin/StatusChip";
import { routes } from "@/config/navigation";
import { adminApi } from "@/lib/api/admin";
import { useAdminAuth } from "@/lib/admin/AdminAuthProvider";
import { flightTime, money, when } from "@/lib/admin/format";
import { useApiData } from "@/lib/hooks/useApiData";
import { styles } from "./BookingsPage.styles";

// Tabs: paid bookings by state, plus unpaid (abandoned) ones.
const TABS = [
  { value: "all", label: "All paid", statuses: ["paid", "booking", "pending", "confirmed", "failed"] },
  { value: "processing", label: "In progress", statuses: ["paid", "booking", "pending"] },
  { value: "confirmed", label: "Confirmed", statuses: ["confirmed"] },
  { value: "failed", label: "Failed", statuses: ["failed"] },
  { value: "unpaid", label: "Unpaid", statuses: ["travellers", "payment"] },
] as const;
const DEBOUNCE_MS = 400;

// Flight bookings (hotels join with hotel payment): newest payments first.
export default function BookingsPage() {
  const { token } = useAdminAuth();
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const tab = TABS.find((item) => item.value === params.get("status"))?.value ?? "all";
  const query = params.get("q") ?? "";
  const page = Math.max(1, Number(params.get("page")) || 1);
  const [search, setSearch] = useState(query);
  const go = (changes: Record<string, string | null>) => {
    const next = new URLSearchParams(params);
    Object.entries(changes).forEach(([key, value]) => (value ? next.set(key, value) : next.delete(key)));
    router.replace(`${pathname}${next.size ? `?${next}` : ""}`);
  };
  useEffect(() => {
    if (search.trim() === query) return;
    const timer = setTimeout(() => go({ q: search.trim() || null, page: null }), DEBOUNCE_MS);
    return () => clearTimeout(timer);
    // go reads the latest params.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, query]);

  const { data, loading, error } = useApiData((signal) => adminApi.flightBookings(token!, { status: tab, q: query, page }, signal), [token, tab, query, page]);
  const count = (statuses: readonly string[]) => (data ? statuses.reduce((sum, status) => sum + (data.counts[status as keyof typeof data.counts] ?? 0), 0) : null);
  const pages = data ? Math.ceil(data.total / data.pageSize) : 0;

  return (
    <>
      <AdminPageHeader title="Bookings" subtitle="Flight bookings: payment, ticketing with TripJack and refunds. Hotel bookings appear here once hotel payment is live." />
      <Tabs value={tab} onChange={(_, next) => go({ status: next === "all" ? null : next, page: null })} variant="scrollable" scrollButtons={false} sx={styles.tabs}>
        {TABS.map((item) => {
          const n = count(item.statuses);
          return <Tab key={item.value} value={item.value} label={`${item.label}${n ? ` (${n})` : ""}`} />;
        })}
      </Tabs>
      <TextField
        size="small"
        placeholder="Search PNR, TripJack ref, email, phone or name"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        slotProps={{ htmlInput: { "aria-label": "Search bookings", maxLength: 100 }, input: { startAdornment: <InputAdornment position="start"><SearchRounded fontSize="small" /></InputAdornment> } }}
        sx={styles.search}
      />
      {error && <Alert severity="error">{error}</Alert>}
      <Box sx={[styles.list, loading && styles.loading]}>
        {!data && !error && [0, 1, 2].map((i) => <Skeleton key={i} variant="rounded" height={76} />)}
        {data?.items.length === 0 && <Typography sx={styles.empty}>{query ? "No bookings match." : "No bookings here yet."}</Typography>}
        {data?.items.map((booking) => (
          <Box key={booking.id} component={Link} href={`${routes.adminBookings}/flights/${booking.id}`} sx={styles.row}>
            <Box sx={styles.main}>
              <Typography sx={styles.title}>
                <b>{booking.route}</b> · {flightTime(booking.departAt)}
              </Typography>
              <Typography sx={styles.meta}>
                {[booking.leadTraveller, booking.travellers > 1 ? `+${booking.travellers - 1}` : null, booking.email].filter(Boolean).join(" · ")}
              </Typography>
              <Typography sx={styles.meta}>
                {booking.pnrs.length ? <b>PNR {booking.pnrs.join(", ")}</b> : `TripJack ${booking.supplierBookingId}`}
              </Typography>
            </Box>
            <Box sx={styles.side}>
              <FlightStatusChip status={booking.status} />
              <Typography sx={styles.amount}>{money(booking.payable)}</Typography>
              {booking.refunded && <Typography sx={styles.refunded}>Refunded {money(booking.refunded)}</Typography>}
              <Typography sx={styles.time}>{booking.paidAt ? `Paid ${when(booking.paidAt)}` : `Started ${when(booking.createdAt)}`}</Typography>
            </Box>
          </Box>
        ))}
      </Box>
      {pages > 1 && (
        <Box sx={styles.pagination}>
          <Pagination page={page} count={pages} color="primary" shape="rounded" onChange={(_, next) => go({ page: next > 1 ? String(next) : null })} />
        </Box>
      )}
    </>
  );
}
