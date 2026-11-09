"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Pagination from "@mui/material/Pagination";
import Skeleton from "@mui/material/Skeleton";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import Typography from "@mui/material/Typography";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { PaymentStatusChip } from "@/components/admin/StatusChip";
import { routes } from "@/config/navigation";
import { adminApi } from "@/lib/api/admin";
import { useAdminAuth } from "@/lib/admin/AdminAuthProvider";
import { money, when } from "@/lib/admin/format";
import { useApiData } from "@/lib/hooks/useApiData";
import { styles } from "./PaymentsPage.styles";

const TABS = [
  { value: "", label: "All" },
  { value: "CAPTURED", label: "Paid" },
  { value: "REFUNDED", label: "Refunded" },
  { value: "PARTIALLY_REFUNDED", label: "Part refunded" },
  { value: "CREATED", label: "Not paid" },
  { value: "FAILED", label: "Failed" },
];

// Every Razorpay order and payment, newest first, with refunds.
export default function PaymentsPage() {
  const { token } = useAdminAuth();
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const status = TABS.find((tab) => tab.value === params.get("status"))?.value ?? "";
  const page = Math.max(1, Number(params.get("page")) || 1);
  const go = (changes: Record<string, string | null>) => {
    const next = new URLSearchParams(params);
    Object.entries(changes).forEach(([key, value]) => (value ? next.set(key, value) : next.delete(key)));
    router.replace(`${pathname}${next.size ? `?${next}` : ""}`);
  };
  const { data, loading, error } = useApiData((signal) => adminApi.payments(token!, { status: status || undefined, page }, signal), [token, status, page]);
  const pages = data ? Math.ceil(data.total / data.pageSize) : 0;
  const all = data ? Object.values(data.counts).reduce<number>((sum, n) => sum + (n ?? 0), 0) : null;

  return (
    <>
      <AdminPageHeader title="Payments & refunds" subtitle="Razorpay orders and payments. Refund from the booking's page." />
      <Tabs value={status} onChange={(_, next) => go({ status: next || null, page: null })} variant="scrollable" scrollButtons={false} sx={styles.tabs}>
        {TABS.map((tab) => {
          const n = tab.value ? data?.counts[tab.value] : all;
          return <Tab key={tab.value || "all"} value={tab.value} label={`${tab.label}${n ? ` (${n})` : ""}`} />;
        })}
      </Tabs>
      {error && <Alert severity="error">{error}</Alert>}
      <Box sx={[styles.list, loading && styles.loading]}>
        {!data && !error && [0, 1, 2].map((i) => <Skeleton key={i} variant="rounded" height={64} />)}
        {data?.items.length === 0 && <Typography sx={styles.empty}>No payments here yet.</Typography>}
        {data?.items.map((payment) => {
          const refunded = payment.refunds.filter((refund) => refund.status !== "FAILED").reduce((sum, refund) => sum + refund.amount.amount, 0);
          const failedRefund = payment.refunds.some((refund) => refund.status === "FAILED");
          const href = payment.flightBookingId
            ? `${routes.adminBookings}/flights/${payment.flightBookingId}`
            : payment.hotelBookingId
              ? `${routes.adminBookings}/hotels/${payment.hotelBookingId}`
              : null;
          const body = (
            <>
              <Box sx={styles.main}>
                <Typography sx={styles.title}>
                  <b>{money(payment.amount)}</b>
                  {payment.method ? ` · ${payment.method}` : ""} · {payment.flightBookingId ? "Flight" : payment.hotelReference ? `Hotel ${payment.hotelReference}` : "Hotel"}
                  {payment.email ? ` · ${payment.email}` : ""}
                </Typography>
                <Typography sx={styles.mono}>{payment.providerPaymentId ?? payment.providerOrderId}</Typography>
              </Box>
              <Box sx={styles.side}>
                <PaymentStatusChip status={payment.status} />
                {refunded > 0 && <Typography sx={styles.refunded}>Refunded {money({ amount: refunded, currency: payment.amount.currency })}</Typography>}
                {failedRefund && <Typography sx={styles.failed}>A refund failed</Typography>}
                <Typography sx={styles.time}>{when(payment.createdAt)}</Typography>
              </Box>
            </>
          );
          return href ? (
            <Box key={payment.id} component={Link} href={href} sx={[styles.row, styles.link]}>
              {body}
            </Box>
          ) : (
            <Box key={payment.id} sx={styles.row}>
              {body}
            </Box>
          );
        })}
      </Box>
      {pages > 1 && (
        <Box sx={styles.pagination}>
          <Pagination page={page} count={pages} color="primary" shape="rounded" onChange={(_, next) => go({ page: next > 1 ? String(next) : null })} />
        </Box>
      )}
    </>
  );
}
