"use client";

import { useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Accordion from "@mui/material/Accordion";
import AccordionDetails from "@mui/material/AccordionDetails";
import AccordionSummary from "@mui/material/AccordionSummary";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Skeleton from "@mui/material/Skeleton";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Typography from "@mui/material/Typography";
import ExpandMoreRounded from "@mui/icons-material/ExpandMoreRounded";
import RefreshRounded from "@mui/icons-material/RefreshRounded";
import type { AdminDashboard } from "@quickhotels/types/admin";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { adminApi } from "@/lib/api/admin";
import { useAdminAuth } from "@/lib/admin/AdminAuthProvider";
import { formatCount, formatPrice } from "@/lib/format";
import { useApiData } from "@/lib/hooks/useApiData";
import AttentionList from "../components/AttentionList";
import RecentBookings from "../components/RecentBookings";
import StatCard from "../components/StatCard";
import TrendChart from "../components/TrendChart";
import { styles } from "./OverviewPage.styles";

const RANGES = [
  { days: 1, label: "Today" },
  { days: 7, label: "7 days" },
  { days: 30, label: "30 days" },
  { days: 90, label: "90 days" },
] as const;

const inr = (amount: number) => formatPrice({ amount, currency: "INR" });
const when = (iso: string) => new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
// "admin.create" → "Admin create".
const action = (value: string) => value.replace(/[._]/g, " ").replace(/^\w/, (c) => c.toUpperCase());
// India days: today and `days - 1` days before it.
function rangeFor(days: number) {
  const today = new Date(Date.now() + 330 * 60_000);
  const from = new Date(today.getTime() - (days - 1) * 86_400_000);
  return { from: from.toISOString().slice(0, 10), to: today.toISOString().slice(0, 10) };
}
const sum = (data: AdminDashboard, key: keyof AdminDashboard["hotels"]) => data.hotels[key] + data.flights[key];
const split = (data: AdminDashboard, key: keyof AdminDashboard["hotels"], format: (n: number) => string = formatCount) =>
  `Hotels ${format(data.hotels[key])} · Flights ${format(data.flights[key])}`;

// Admin home (spec §5.2): bookings and money for the chosen dates, what needs
// attention now, recent bookings, TripJack health and admin activity.
export default function OverviewPage() {
  const { admin, token } = useAdminAuth();
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const days = RANGES.find((range) => String(range.days) === params.get("days"))?.days ?? 30;
  const range = useMemo(() => rangeFor(days), [days]);
  const canSeeBookings = Boolean(admin?.permissions.includes("bookings"));

  // Bumped by the refresh button to load the dashboard again.
  const [refreshes, setRefreshes] = useState(0);
  const overview = useApiData((signal) => adminApi.overview(token!, signal), [token]);
  const dashboard = useApiData(
    (signal) => (canSeeBookings ? adminApi.dashboard(token!, range, signal) : Promise.resolve(null)),
    [token, canSeeBookings, range.from, range.to, refreshes],
  );
  const data = dashboard.data;
  const waiting = data?.attention.filter((item) => item.kind === "awaiting_confirmation").length ?? 0;

  return (
    <>
      <AdminPageHeader title={`Hello, ${admin?.name.split(" ")[0] ?? "there"}`} subtitle="What's happening on QuickHotels24/7." />
      {canSeeBookings && (
        <>
          <Box sx={styles.toolbar}>
            <ToggleButtonGroup
              exclusive
              size="small"
              value={days}
              onChange={(_, value: number | null) => value && router.replace(`${pathname}?days=${value}`, { scroll: false })}
              aria-label="Dates"
            >
              {RANGES.map((option) => (
                <ToggleButton key={option.days} value={option.days}>
                  {option.label}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
            <Typography component="div" sx={styles.refreshed}>
              {data ? `Updated ${when(data.generatedAt)}` : "Loading…"}
              <IconButton size="small" aria-label="Refresh" onClick={() => setRefreshes((n) => n + 1)} disabled={dashboard.loading}>
                <RefreshRounded fontSize="small" />
              </IconButton>
            </Typography>
          </Box>
          {dashboard.error && <Alert severity="error" sx={{ mb: 2 }}>{dashboard.error}</Alert>}

          <Typography component="h2" sx={styles.sectionTitle}>
            Bookings
          </Typography>
          <Box sx={styles.stats}>
            {data ? (
              <>
                <StatCard label="Booking value" value={inr(sum(data, "bookingValue"))} note={`Confirmed bookings · ${split(data, "bookingValue", inr)}`} />
                <StatCard label="Our earnings" value={inr(sum(data, "earnings"))} note="Markup after coupons, confirmed bookings" />
                <StatCard label="Paid bookings" value={formatCount(sum(data, "paid"))} note={`${formatCount(sum(data, "confirmed"))} confirmed · ${formatCount(sum(data, "attempts"))} checkouts opened`} href="/admin/bookings" />
                <StatCard
                  label="Waiting for supplier"
                  value={formatCount(waiting)}
                  note="Paid, not confirmed yet (right now)"
                  href="/admin/bookings?product=hotels&status=processing"
                  tone={waiting ? "warning" : "default"}
                />
                <StatCard label="Failed" value={formatCount(sum(data, "failed"))} note={`Supplier couldn't confirm; refunded · ${split(data, "failed")}`} href="/admin/bookings?product=hotels&status=failed" />
                <StatCard label="Cancelled" value={formatCount(sum(data, "cancelled"))} note="Hotel bookings cancelled after confirming" href="/admin/bookings?product=hotels&status=cancelled" />
                <StatCard label="Money collected" value={inr(data.money.collected)} note="Payments captured (Razorpay)" href="/admin/payments" />
                <StatCard label="Refunded" value={inr(data.money.refunded)} note="Refunds sent or in progress" href="/admin/payments" />
              </>
            ) : (
              Array.from({ length: 8 }, (_, i) => <Skeleton key={i} variant="rounded" height={128} sx={styles.skeleton} />)
            )}
          </Box>

          <Box sx={styles.columns}>
            <Box sx={styles.stack}>
              <Box sx={styles.card}>
                <Box sx={styles.cardHead}>
                  <Typography component="h2" sx={styles.cardTitle}>
                    Needs attention
                  </Typography>
                  <Typography sx={styles.cardNote}>Right now, any date</Typography>
                </Box>
                {data ? <AttentionList items={data.attention} /> : <Skeleton variant="rounded" height={120} />}
              </Box>
              <Box sx={styles.card}>
                <Box sx={styles.cardHead}>
                  <Typography component="h2" sx={styles.cardTitle}>
                    Paid bookings per day
                  </Typography>
                  <Typography sx={styles.cardNote}>Hover a bar for details</Typography>
                </Box>
                {data ? <TrendChart trend={data.trend} /> : <Skeleton variant="rounded" height={160} />}
              </Box>
            </Box>
            <Box sx={styles.stack}>
              <Box sx={styles.card}>
                <Box sx={styles.cardHead}>
                  <Typography component="h2" sx={styles.cardTitle}>
                    Recent bookings
                  </Typography>
                </Box>
                {data ? <RecentBookings bookings={data.recent} /> : <Skeleton variant="rounded" height={160} />}
              </Box>
              <Box sx={styles.card}>
                <Box sx={styles.cardHead}>
                  <Typography component="h2" sx={styles.cardTitle}>
                    TripJack
                  </Typography>
                  <Typography sx={styles.cardNote}>Last 24 hours</Typography>
                </Box>
                {data ? (
                  <>
                    <Box sx={styles.health}>
                      <Box>
                        <Typography sx={styles.healthValue}>{formatCount(data.supplier.calls)}</Typography>
                        <Typography sx={styles.healthLabel}>Calls</Typography>
                      </Box>
                      <Box>
                        <Typography sx={[styles.healthValue, data.supplier.failed > 0 && { color: "warning.dark" }]}>
                          {data.supplier.calls ? `${Math.round((data.supplier.failed / data.supplier.calls) * 100)}%` : "—"}
                        </Typography>
                        <Typography sx={styles.healthLabel}>Failed ({formatCount(data.supplier.failed)})</Typography>
                      </Box>
                      <Box>
                        <Typography sx={styles.healthValue}>{data.supplier.averageMs === null ? "—" : `${(data.supplier.averageMs / 1000).toFixed(1)} s`}</Typography>
                        <Typography sx={styles.healthLabel}>Average time</Typography>
                      </Box>
                    </Box>
                    {data.supplier.lastFailureAt && (
                      <Typography sx={[styles.cardNote, { mt: 1.5 }]}>
                        Last failure {when(data.supplier.lastFailureAt)} · {data.supplier.lastFailure}
                      </Typography>
                    )}
                  </>
                ) : (
                  <Skeleton variant="rounded" height={72} />
                )}
              </Box>
            </Box>
          </Box>

          <Accordion disableGutters elevation={0} sx={[styles.card, { p: { xs: 0, md: 0 }, mb: 3, "&::before": { display: "none" } }]}>
            <AccordionSummary expandIcon={<ExpandMoreRounded />}>
              <Typography sx={styles.action}>How these numbers are counted</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Box component="ul" sx={styles.definitions}>
                <li>Dates are India days. Hotel bookings count on the day they were paid; flights on the day they were paid.</li>
                <li><b>Booking value</b>: what customers paid for bookings the supplier confirmed (including ones cancelled later). It is not our revenue.</li>
                <li><b>Our earnings</b>: price paid minus the supplier&apos;s net price, for confirmed bookings that are still active. Coupons reduce it. Cancelled bookings are left out.</li>
                <li><b>Paid bookings</b>: customers who paid. <b>Checkouts opened</b>: rates re-checked at checkout, paid or not.</li>
                <li><b>Failed</b>: paid, but the supplier couldn&apos;t confirm; the customer is refunded in full.</li>
                <li><b>Money collected / Refunded</b>: Razorpay payments captured and refunds sent in these dates, for all products.</li>
                <li><b>Needs attention</b> and <b>Waiting for supplier</b> show what is open right now, whatever dates are chosen.</li>
              </Box>
            </AccordionDetails>
          </Accordion>
        </>
      )}

      <Typography component="h2" sx={styles.sectionTitle}>
        Customers and team
      </Typography>
      {overview.error && <Alert severity="error">{overview.error}</Alert>}
      <Box sx={styles.stats}>
        {overview.data ? (
          <>
            <StatCard label="Customers" value={formatCount(overview.data.users.total)} href={admin?.permissions.includes("customers") ? "/admin/customers" : undefined} />
            <StatCard label="New this week" value={formatCount(overview.data.users.newLast7Days)} note="Sign-ups in the last 7 days" />
          </>
        ) : (
          [0, 1].map((i) => <Skeleton key={i} variant="rounded" height={120} sx={styles.skeleton} />)
        )}
      </Box>
      <Box sx={styles.card}>
        <Typography component="h2" sx={[styles.cardTitle, { mb: 1.5 }]}>
          Recent admin activity
        </Typography>
        {overview.data && !overview.data.recentActivity.length && <Typography sx={styles.empty}>Nothing yet.</Typography>}
        <Box component="ul" sx={styles.list}>
          {overview.data?.recentActivity.map((entry) => (
            <Box component="li" key={entry.id} sx={styles.row}>
              <Box>
                <Typography sx={styles.action}>{action(entry.action)}</Typography>
                <Typography sx={styles.meta}>
                  {entry.adminName ?? "System"}
                  {entry.target ? ` · ${entry.target}` : ""}
                </Typography>
              </Box>
              <Typography sx={styles.time}>{when(entry.createdAt)}</Typography>
            </Box>
          ))}
        </Box>
      </Box>
    </>
  );
}
