"use client";

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Skeleton from "@mui/material/Skeleton";
import Typography from "@mui/material/Typography";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { adminApi } from "@/lib/api/admin";
import { useAdminAuth } from "@/lib/admin/AdminAuthProvider";
import { formatCount } from "@/lib/format";
import { useApiData } from "@/lib/hooks/useApiData";
import StatCard from "../components/StatCard";
import { styles } from "./OverviewPage.styles";

const when = (iso: string) => new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
// "admin.create" → "Admin create".
const action = (value: string) => value.replace(/[._]/g, " ").replace(/^\w/, (c) => c.toUpperCase());

// Overview (spec §5.1): headline numbers and the latest admin activity.
// Booking and revenue figures join once bookings are live (step 8).
export default function OverviewPage() {
  const { admin, token } = useAdminAuth();
  const { data, error } = useApiData((signal) => adminApi.overview(token!, signal), [token]);
  return (
    <>
      <AdminPageHeader title={`Hello, ${admin?.name.split(" ")[0] ?? "there"}`} subtitle="What's happening on QuickHotels24/7." />
      {error && <Alert severity="error">{error}</Alert>}
      <Box sx={styles.stats}>
        {data ? (
          <>
            <StatCard label="Customers" value={formatCount(data.users.total)} />
            <StatCard label="New this week" value={formatCount(data.users.newLast7Days)} note="Sign-ups in the last 7 days" />
            <StatCard label="Bookings" value="—" note="Shown once payments go live" />
          </>
        ) : (
          [0, 1, 2].map((i) => <Skeleton key={i} variant="rounded" height={120} sx={styles.skeleton} />)
        )}
      </Box>
      <Box sx={styles.card}>
        <Typography component="h2" sx={styles.cardTitle}>
          Recent admin activity
        </Typography>
        {data && !data.recentActivity.length && <Typography sx={styles.empty}>Nothing yet.</Typography>}
        <Box component="ul" sx={styles.list}>
          {data?.recentActivity.map((entry) => (
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
