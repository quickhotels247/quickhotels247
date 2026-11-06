"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Breadcrumbs from "@mui/material/Breadcrumbs";
import MuiLink from "@mui/material/Link";
import Skeleton from "@mui/material/Skeleton";
import Typography from "@mui/material/Typography";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { routes } from "@/config/navigation";
import { adminApi } from "@/lib/api/admin";
import { useAdminAuth } from "@/lib/admin/AdminAuthProvider";
import { useApiData } from "@/lib/hooks/useApiData";
import { styles } from "./CustomerDetailPage.styles";

const when = (iso: string | null) => (iso ? new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" }) : "Never");

// One customer's account (spec §5.4). Their bookings join here with step 8.
export default function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { token } = useAdminAuth();
  const { data: user, error } = useApiData((signal) => adminApi.user(token!, id, signal), [token, id]);
  const rows: [string, string][] = user
    ? [
        ["Email", user.email],
        ["Username", `@${user.username}`],
        ["Signed up with", user.signedInWith === "Google" ? "Google" : "Email and password"],
        ["Joined", when(user.createdAt)],
        ["Last active", when(user.lastActiveAt)],
        ["Customer ID", user.id],
      ]
    : [];
  return (
    <>
      <Breadcrumbs sx={styles.crumbs}>
        <MuiLink component={Link} href={routes.adminCustomers} underline="hover" color="inherit">
          Customers
        </MuiLink>
        <Typography sx={styles.crumb}>{user?.name ?? "Customer"}</Typography>
      </Breadcrumbs>
      {error && <Alert severity="error">{error}</Alert>}
      {!user && !error && <Skeleton variant="rounded" height={240} />}
      {user && (
        <>
          <AdminPageHeader title={user.name} subtitle={user.email} />
          <Box component="dl" sx={styles.card}>
            {rows.map(([label, value]) => (
              <Box key={label} sx={styles.row}>
                <Typography component="dt" sx={styles.label}>
                  {label}
                </Typography>
                <Typography component="dd" sx={styles.value}>
                  {value}
                </Typography>
              </Box>
            ))}
          </Box>
          <Alert severity="info" sx={styles.note}>
            Bookings, payments and support history appear here once bookings are live.
          </Alert>
        </>
      )}
    </>
  );
}
