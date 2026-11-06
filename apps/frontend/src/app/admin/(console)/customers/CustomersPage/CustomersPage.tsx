"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import InputAdornment from "@mui/material/InputAdornment";
import Pagination from "@mui/material/Pagination";
import Skeleton from "@mui/material/Skeleton";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import SearchRounded from "@mui/icons-material/SearchRounded";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { routes } from "@/config/navigation";
import { adminApi } from "@/lib/api/admin";
import { useAdminAuth } from "@/lib/admin/AdminAuthProvider";
import { formatCount } from "@/lib/format";
import { useApiData } from "@/lib/hooks/useApiData";
import { styles } from "./CustomersPage.styles";

const DEBOUNCE_MS = 400;
const day = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—");

// Customers (spec §5.4): search by name, email or username; 25 per page.
// Search and page live in the URL.
export default function CustomersPage() {
  const { token } = useAdminAuth();
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const query = params.get("q") ?? "";
  const page = Math.max(1, Number(params.get("page")) || 1);
  const [search, setSearch] = useState(query);

  useEffect(() => {
    if (search.trim() === query) return;
    const timer = setTimeout(() => router.replace(search.trim() ? `${pathname}?${new URLSearchParams({ q: search.trim() })}` : pathname), DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [search, query, pathname, router]);

  const { data, loading, error } = useApiData((signal) => adminApi.users(token!, query, page, signal), [token, query, page]);
  const pages = data ? Math.ceil(data.total / data.pageSize) : 0;
  const goTo = (next: number) => {
    const nextParams = new URLSearchParams(params);
    if (next > 1) nextParams.set("page", String(next));
    else nextParams.delete("page");
    router.replace(`${pathname}${nextParams.size ? `?${nextParams}` : ""}`);
  };

  return (
    <>
      <AdminPageHeader title="Customers" subtitle={data ? `${formatCount(data.total)} ${query ? "matching" : "in total"}` : "Everyone with a QuickHotels24/7 account."} />
      <TextField
        size="small"
        placeholder="Search name, email or username"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        slotProps={{ htmlInput: { "aria-label": "Search customers", maxLength: 100 }, input: { startAdornment: <InputAdornment position="start"><SearchRounded fontSize="small" /></InputAdornment> } }}
        sx={styles.search}
      />
      {error && <Alert severity="error">{error}</Alert>}
      <TableContainer sx={[styles.table, loading && styles.loading]}>
        <Table size="small" aria-label="Customers">
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Email</TableCell>
              <TableCell sx={styles.wide}>Signed up with</TableCell>
              <TableCell sx={styles.wide}>Joined</TableCell>
              <TableCell sx={styles.wide}>Last active</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {!data
              ? [0, 1, 2, 3].map((i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={5}>
                      <Skeleton />
                    </TableCell>
                  </TableRow>
                ))
              : data.items.map((user) => (
                  <TableRow key={user.id} hover sx={styles.row} onClick={() => router.push(`${routes.adminCustomers}/${user.id}`)}>
                    <TableCell>
                      <Link href={`${routes.adminCustomers}/${user.id}`} style={{ color: "inherit", fontWeight: 600 }}>
                        {user.name}
                      </Link>
                      <Typography sx={styles.username}>@{user.username}</Typography>
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell sx={styles.wide}>
                      <Chip label={user.signedInWith === "Google" ? "Google" : "Email"} size="small" variant="outlined" />
                    </TableCell>
                    <TableCell sx={styles.wide}>{day(user.createdAt)}</TableCell>
                    <TableCell sx={styles.wide}>{day(user.lastActiveAt)}</TableCell>
                  </TableRow>
                ))}
            {data && !data.items.length && (
              <TableRow>
                <TableCell colSpan={5} sx={styles.empty}>
                  {query ? `No customers match "${query}".` : "No customers yet."}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
      {pages > 1 && (
        <Box sx={styles.pagination}>
          <Pagination page={page} count={pages} color="primary" shape="rounded" onChange={(_, next) => goTo(next)} />
        </Box>
      )}
    </>
  );
}
