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
import type { TicketStatus } from "@quickhotels/types/support";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { routes } from "@/config/navigation";
import { adminApi } from "@/lib/api/admin";
import { useAdminAuth } from "@/lib/admin/AdminAuthProvider";
import { useApiData } from "@/lib/hooks/useApiData";
import TicketStatusChip from "../components/TicketStatusChip";
import { STATUS_LABEL, STATUSES, topicText, when } from "../utils/ticketText";
import { styles } from "./SupportInboxPage.styles";

const DEBOUNCE_MS = 400;

// Support requests from /help, newest activity first; status tabs and search in the URL.
export default function SupportInboxPage() {
  const { token } = useAdminAuth();
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const status = (STATUSES.find((value) => value === params.get("status")) ?? undefined) as TicketStatus | undefined;
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

  const { data, loading, error } = useApiData((signal) => adminApi.tickets(token!, { status, q: query, page }, signal), [token, status, query, page]);
  const pages = data ? Math.ceil(data.total / data.pageSize) : 0;
  const all = data ? Object.values(data.counts).reduce((sum, n) => sum + (n ?? 0), 0) : null;

  return (
    <>
      <AdminPageHeader title="Support" subtitle="Requests from the Help page. Replies are emailed to the customer." />
      <Tabs value={status ?? "ALL"} onChange={(_, next) => go({ status: next === "ALL" ? null : next, page: null })} variant="scrollable" scrollButtons={false} sx={styles.tabs}>
        <Tab value="ALL" label={`All${all !== null ? ` (${all})` : ""}`} />
        {STATUSES.map((value) => (
          <Tab key={value} value={value} label={`${STATUS_LABEL[value]}${data?.counts[value] ? ` (${data.counts[value]})` : ""}`} />
        ))}
      </Tabs>
      <TextField
        size="small"
        placeholder="Search reference, email, name or message"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        slotProps={{ htmlInput: { "aria-label": "Search requests", maxLength: 100 }, input: { startAdornment: <InputAdornment position="start"><SearchRounded fontSize="small" /></InputAdornment> } }}
        sx={styles.search}
      />
      {error && <Alert severity="error">{error}</Alert>}
      <Box sx={[styles.list, loading && styles.loading]}>
        {!data && !error && [0, 1, 2].map((i) => <Skeleton key={i} variant="rounded" height={72} />)}
        {data?.items.length === 0 && <Typography sx={styles.empty}>{query || status ? "No requests match." : "No support requests yet."}</Typography>}
        {data?.items.map((ticket) => (
          <Box key={ticket.id} component={Link} href={`${routes.adminSupport}/${ticket.id}`} sx={styles.row}>
            <Box sx={styles.rowMain}>
              <Typography sx={styles.rowTitle}>
                <b>{ticket.reference}</b> · {ticket.name ?? ticket.email} · {topicText(ticket.topic)}
                {ticket.bookingReference && <Box component="span" sx={styles.booking}> · {ticket.bookingReference}</Box>}
              </Typography>
              <Typography sx={styles.preview}>{ticket.preview}</Typography>
            </Box>
            <Box sx={styles.rowSide}>
              <TicketStatusChip status={ticket.status} />
              <Typography sx={styles.time}>{when(ticket.updatedAt)}</Typography>
              {ticket.assignedTo && <Typography sx={styles.time}>{ticket.assignedTo}</Typography>}
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
