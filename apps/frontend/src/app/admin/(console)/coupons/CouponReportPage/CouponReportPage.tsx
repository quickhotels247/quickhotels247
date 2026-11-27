"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Breadcrumbs from "@mui/material/Breadcrumbs";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import MuiLink from "@mui/material/Link";
import Skeleton from "@mui/material/Skeleton";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import type { AdminFlightStatus, AdminHotelStatus } from "@quickhotels/types/admin";
import type { CouponAction, CouponReport } from "@quickhotels/types/coupons";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { FlightStatusChip, HotelStatusChip } from "@/components/admin/StatusChip";
import { adminApi } from "@/lib/api/admin";
import { useAdminAuth } from "@/lib/admin/AdminAuthProvider";
import { formatCount, formatPrice } from "@/lib/format";
import { useApiData } from "@/lib/hooks/useApiData";
import { useRequest } from "@/lib/hooks/useRequest";
import StatCard from "../../components/StatCard";
import { discountText } from "../components/CouponRow/CouponRow";
import { styles } from "./CouponReportPage.styles";

const inr = (amount: number) => formatPrice({ amount, currency: "INR" });
const day = (iso: string) => new Date(`${iso}T00:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
const when = (iso: string) => new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" });

const CONFIRM: Record<CouponAction, { title: string; text: string; button: string }> = {
  pause: { title: "Pause this coupon?", text: "The code stops working at checkout until you resume it. Checkouts that already applied it keep their discount.", button: "Pause" },
  resume: { title: "Resume this coupon?", text: "The code works at checkout again, within its dates and limits.", button: "Resume" },
  end: { title: "End this coupon now?", text: "Its end date becomes now, so the code stops working for good. To use it again, edit the dates.", button: "End now" },
};

// One coupon's report (spec §5.8): totals, every use with its booking, and
// pause / resume / end now.
export default function CouponReportPage() {
  const { id } = useParams<{ id: string }>();
  const { token } = useAdminAuth();
  const { data, error } = useApiData((signal) => adminApi.couponReport(token!, id, signal), [token, id]);
  const [report, setReport] = useState<CouponReport | null>(null);
  const [confirming, setConfirming] = useState<CouponAction | null>(null);
  const request = useRequest();
  useEffect(() => setReport(data), [data]);

  function act() {
    const action = confirming;
    if (!action || !token) return;
    void request.run(async () => {
      setReport(await adminApi.couponAction(token, id, action));
      setConfirming(null);
    });
  }

  const coupon = report?.coupon;
  const expired = Boolean(coupon?.expired);
  const status = !coupon ? null : expired ? { label: "Expired", color: "default" as const } : coupon.status === "ACTIVE" ? { label: "Active", color: "success" as const } : { label: coupon.status === "DRAFT" ? "Draft" : "Paused", color: "default" as const };

  return (
    <>
      <Breadcrumbs sx={styles.crumbs}>
        <MuiLink component={Link} href="/admin/coupons" underline="hover" color="inherit">
          Coupons
        </MuiLink>
        <Typography sx={styles.crumb}>{coupon?.code ?? "Report"}</Typography>
      </Breadcrumbs>
      {error && <Alert severity="error">{error}</Alert>}
      {!report && !error && <Skeleton variant="rounded" height={320} />}
      {report && coupon && (
        <>
          <AdminPageHeader
            title={coupon.code}
            subtitle={coupon.title ?? undefined}
            actions={
              <Box sx={styles.actions}>
                {coupon.status === "ACTIVE" && !expired && (
                  <Button variant="outlined" onClick={() => setConfirming("pause")}>
                    Pause
                  </Button>
                )}
                {coupon.status !== "ACTIVE" && !expired && (
                  <Button variant="outlined" onClick={() => setConfirming("resume")}>
                    Resume
                  </Button>
                )}
                {!expired && (
                  <Button variant="outlined" color="error" onClick={() => setConfirming("end")}>
                    End now
                  </Button>
                )}
              </Box>
            }
          />
          <Typography component="div" sx={styles.summary}>
            {status && <Chip size="small" variant="outlined" color={status.color} label={status.label} sx={styles.chip} />}
            <span>{discountText(coupon)}</span>
            <span>· {coupon.product === "HOTEL" ? "Hotels" : coupon.product === "FLIGHT" ? "Flights" : "Hotels & flights"}</span>
            <span>· {day(coupon.validFrom)} – {day(coupon.validTo)}</span>
            {coupon.usageLimit !== null && <span>· limit {coupon.usageLimit} uses</span>}
            {coupon.perUserLimit !== null && <span>· {coupon.perUserLimit} per customer</span>}
          </Typography>

          <Box sx={styles.stats}>
            <StatCard label="Uses" value={formatCount(report.totals.uses)} note={coupon.usageLimit ? `of ${coupon.usageLimit} allowed` : "No total limit"} />
            <StatCard label="Discount given" value={inr(report.totals.discountGiven)} note="Comes out of our markup" />
            <StatCard label="Booking value" value={inr(report.totals.bookingValue)} note="What customers paid, after the discount" />
            <StatCard label="Customers" value={formatCount(report.totals.customers)} note="Different people who used it" />
          </Box>

          <Box sx={styles.card}>
            <Typography component="h2" sx={styles.cardTitle}>
              Who used it
            </Typography>
            {report.redemptions.length === 0 ? (
              <Typography sx={styles.empty}>Nobody has used this coupon on a paid booking yet.</Typography>
            ) : (
              <Box sx={styles.tableWrap}>
                <Table size="small" sx={styles.table}>
                  <TableHead>
                    <TableRow>
                      <TableCell>Used</TableCell>
                      <TableCell>Customer</TableCell>
                      <TableCell>Booking</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell sx={styles.right}>Paid</TableCell>
                      <TableCell sx={styles.right}>Discount</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {report.redemptions.map((use) => (
                      <TableRow key={use.id} hover>
                        <TableCell sx={{ whiteSpace: "nowrap" }}>{when(use.usedAt)}</TableCell>
                        <TableCell>
                          {use.customer.name ?? use.customer.email ?? "—"}
                          <Typography sx={styles.muted}>{use.customer.name ? use.customer.email : use.customer.signedIn ? "" : "Guest"}</Typography>
                        </TableCell>
                        <TableCell>
                          {use.bookingId && use.reference ? (
                            <MuiLink component={Link} href={`/admin/bookings/${use.product === "hotel" ? "hotels" : "flights"}/${use.bookingId}`} underline="hover">
                              {use.reference}
                            </MuiLink>
                          ) : (
                            "—"
                          )}
                          <Typography sx={styles.muted}>{[use.product === "hotel" ? "Hotel" : "Flight", use.title].filter(Boolean).join(" · ")}</Typography>
                        </TableCell>
                        <TableCell>
                          {use.status ? use.product === "hotel" ? <HotelStatusChip status={use.status as AdminHotelStatus} /> : <FlightStatusChip status={use.status as AdminFlightStatus} /> : "—"}
                        </TableCell>
                        <TableCell sx={styles.right}>{use.paid === null ? "—" : inr(use.paid)}</TableCell>
                        <TableCell sx={styles.right}>{inr(use.discount)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Box>
            )}
            <Typography sx={styles.note}>A use is counted once the customer pays. If the supplier can&apos;t confirm and we refund, the use is removed.</Typography>
          </Box>
        </>
      )}
      <Dialog open={Boolean(confirming)} onClose={request.busy ? undefined : () => setConfirming(null)} maxWidth="xs" fullWidth>
        <DialogTitle>{confirming && CONFIRM[confirming].title}</DialogTitle>
        <DialogContent>
          {request.error && <Alert severity="error" sx={{ mb: 2 }}>{request.error}</Alert>}
          <Typography>{confirming && CONFIRM[confirming].text}</Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setConfirming(null)} disabled={request.busy}>
            Cancel
          </Button>
          <Button variant="contained" color={confirming === "end" ? "error" : "primary"} onClick={act} disabled={request.busy}>
            {request.busy ? "Saving…" : confirming && CONFIRM[confirming].button}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
