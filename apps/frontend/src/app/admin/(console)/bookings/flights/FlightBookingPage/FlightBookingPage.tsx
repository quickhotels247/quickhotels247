"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Breadcrumbs from "@mui/material/Breadcrumbs";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import MuiLink from "@mui/material/Link";
import Skeleton from "@mui/material/Skeleton";
import Typography from "@mui/material/Typography";
import CurrencyRupeeRounded from "@mui/icons-material/CurrencyRupeeRounded";
import RefreshRounded from "@mui/icons-material/RefreshRounded";
import type { AdminFlightBooking } from "@quickhotels/types/admin";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { FlightStatusChip, PaymentStatusChip } from "@/components/admin/StatusChip";
import { routes } from "@/config/navigation";
import { adminApi } from "@/lib/api/admin";
import { useAdminAuth } from "@/lib/admin/AdminAuthProvider";
import { flightTime, money, when } from "@/lib/admin/format";
import { useApiData } from "@/lib/hooks/useApiData";
import { useRequest } from "@/lib/hooks/useRequest";
import RefundDialog from "../../components/RefundDialog";
import { styles } from "./FlightBookingPage.styles";

// One flight booking for staff: status and actions, the trip, travellers,
// PNRs/tickets, the money (paid, TripJack net, our margin), payments and refunds.
export default function FlightBookingPage() {
  const { id } = useParams<{ id: string }>();
  const { token, admin } = useAdminAuth();
  const { data, error } = useApiData((signal) => adminApi.flightBooking(token!, id, signal), [token, id]);
  const [booking, setBooking] = useState<AdminFlightBooking | null>(null);
  const [refunding, setRefunding] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const recheck = useRequest();
  useEffect(() => setBooking(data), [data]);

  const canRefund = Boolean(admin?.permissions.includes("refunds"));
  const captured = booking?.payments.find((payment) => ["CAPTURED", "PARTIALLY_REFUNDED", "REFUNDED"].includes(payment.status));
  const refundedSoFar = captured?.refunds.filter((refund) => refund.status !== "FAILED").reduce((sum, refund) => sum + refund.amount.amount, 0) ?? 0;
  const refundable = captured ? Math.round((captured.amount.amount - refundedSoFar) * 100) / 100 : 0;

  const doRecheck = () =>
    void recheck.run(async () => {
      const result = await adminApi.recheckFlightBooking(token!, id);
      setBooking(result.booking);
      setNotice(`TripJack says: ${result.supplierStatus}.`);
    });

  const row = (label: string, value: React.ReactNode) => (
    <Box sx={styles.kv}>
      <Typography sx={styles.k}>{label}</Typography>
      <Typography component="div" sx={styles.v}>
        {value}
      </Typography>
    </Box>
  );

  return (
    <>
      <Breadcrumbs sx={styles.crumbs}>
        <MuiLink component={Link} href={routes.adminBookings} underline="hover" color="inherit">
          Bookings
        </MuiLink>
        <Typography sx={styles.crumb}>{booking?.route ?? "Flight booking"}</Typography>
      </Breadcrumbs>
      {error && <Alert severity="error">{error}</Alert>}
      {!booking && !error && <Skeleton variant="rounded" height={320} />}
      {booking && token && (
        <>
          <AdminPageHeader
            title={booking.route}
            subtitle={`${flightTime(booking.departAt)} · ${booking.travellers} traveller${booking.travellers === 1 ? "" : "s"} · TripJack ${booking.supplierBookingId}`}
            actions={
              <Box sx={styles.actions}>
                <Button variant="outlined" startIcon={<RefreshRounded />} onClick={doRecheck} disabled={recheck.busy || booking.status === "travellers" || booking.status === "payment"}>
                  {recheck.busy ? "Checking…" : "Re-check with TripJack"}
                </Button>
                {canRefund && refundable > 0 && (
                  <Button variant="contained" color="error" startIcon={<CurrencyRupeeRounded />} onClick={() => setRefunding(true)}>
                    Refund
                  </Button>
                )}
              </Box>
            }
          />
          {recheck.error && <Alert severity="error" sx={styles.alert}>{recheck.error}</Alert>}
          {notice && <Alert severity="info" onClose={() => setNotice(null)} sx={styles.alert}>{notice}</Alert>}
          {booking.status === "failed" && booking.failureReason && <Alert severity="error" sx={styles.alert}>Failed: {booking.failureReason}</Alert>}
          {booking.opsAlertedAt && booking.status !== "confirmed" && booking.status !== "failed" && (
            <Alert severity="warning" sx={styles.alert}>Still no tickets; the team was alerted {when(booking.opsAlertedAt)}.</Alert>
          )}

          <Box sx={styles.grid}>
            <Box sx={styles.col}>
              <Box sx={styles.card}>
                <Box sx={styles.cardHead}>
                  <Typography component="h2" sx={styles.h2}>Status</Typography>
                  <FlightStatusChip status={booking.status} />
                </Box>
                {row("Started", when(booking.createdAt))}
                {row("Paid", when(booking.paidAt))}
                {row("Ticketed", when(booking.bookedAt))}
                {row("Last update", when(booking.updatedAt))}
                {row("PNR", booking.pnrs.length ? <b>{booking.pnrs.join(", ")}</b> : "—")}
              </Box>
              <Box sx={styles.card}>
                <Typography component="h2" sx={styles.h2}>Trip</Typography>
                {booking.journeys.map((leg, i) => (
                  <Box key={i} sx={styles.leg}>
                    <Typography sx={styles.legTitle}>{leg.from} → {leg.to}</Typography>
                    <Typography sx={styles.small}>{flightTime(leg.departAt)} – {flightTime(leg.arriveAt)} · {leg.flights.join(" + ")} · {leg.airlines}</Typography>
                  </Box>
                ))}
              </Box>
              <Box sx={styles.card}>
                <Typography component="h2" sx={styles.h2}>Travellers</Typography>
                {booking.travellerList.length === 0 && <Typography sx={styles.small}>Not entered yet.</Typography>}
                {booking.travellerList.map((traveller) => (
                  <Typography key={traveller.name} sx={styles.small}>
                    {traveller.name} · {traveller.type}{traveller.dateOfBirth ? ` · born ${traveller.dateOfBirth}` : ""}
                  </Typography>
                ))}
                {booking.tickets.length > 0 && (
                  <>
                    <Divider sx={styles.divider} />
                    {booking.tickets.map((ticket) => (
                      <Typography key={`${ticket.traveller}-${ticket.route}`} sx={styles.small}>
                        {ticket.traveller} · {ticket.route} · ticket <b>{ticket.ticket}</b>
                      </Typography>
                    ))}
                  </>
                )}
                <Divider sx={styles.divider} />
                {row("Email", booking.email ? <MuiLink href={`mailto:${booking.email}`}>{booking.email}</MuiLink> : "—")}
                {row("Phone", booking.phone ?? "—")}
              </Box>
            </Box>
            <Box sx={styles.col}>
              <Box sx={styles.card}>
                <Typography component="h2" sx={styles.h2}>Money</Typography>
                {row("Fare shown", money(booking.money.fare))}
                {row("Coupon", booking.money.coupon ? `${booking.money.coupon.code} −${money(booking.money.coupon.discount)}` : "—")}
                {row("Customer pays", <b>{money(booking.money.payable)}</b>)}
                {row("TripJack net", money(booking.money.supplierNet))}
                {row("Our margin", booking.money.margin ? <Box component="span" sx={booking.money.margin.amount < 0 ? styles.loss : styles.gain}>{money(booking.money.margin)}</Box> : "—")}
                {row("Markup rule", booking.money.markupRule ? `v${booking.money.markupRule.version}` : "None")}
                {booking.refunded && row("Refunded", <Box component="span" sx={styles.refunded}>{money(booking.refunded)}</Box>)}
              </Box>
              <Box sx={styles.card}>
                <Typography component="h2" sx={styles.h2}>Payments</Typography>
                {booking.payments.length === 0 && <Typography sx={styles.small}>No payment started.</Typography>}
                {booking.payments.map((payment) => (
                  <Box key={payment.id} sx={styles.payment}>
                    <Box sx={styles.cardHead}>
                      <Typography sx={styles.legTitle}>{money(payment.amount)}{payment.method ? ` · ${payment.method}` : ""}</Typography>
                      <PaymentStatusChip status={payment.status} />
                    </Box>
                    <Typography sx={styles.mono}>{payment.providerPaymentId ?? payment.providerOrderId}</Typography>
                    <Typography sx={styles.small}>{when(payment.createdAt)}</Typography>
                    {payment.refunds.map((refund) => (
                      <Box key={refund.id} sx={styles.refund}>
                        <Box sx={styles.cardHead}>
                          <Typography sx={styles.small}>Refund {money(refund.amount)} · {refund.by}</Typography>
                          <PaymentStatusChip status={refund.status} />
                        </Box>
                        <Typography sx={styles.small}>{when(refund.createdAt)}{refund.reason ? ` · ${refund.reason}` : ""}</Typography>
                        {refund.providerRefundId && <Typography sx={styles.mono}>{refund.providerRefundId}</Typography>}
                      </Box>
                    ))}
                  </Box>
                ))}
              </Box>
            </Box>
          </Box>
          {canRefund && (
            <RefundDialog
              open={refunding}
              refundable={refundable}
              warning={booking.status === "confirmed" ? "This booking is ticketed. A refund only returns money; cancel the tickets with TripJack separately, or the airline seats stay booked." : null}
              onClose={() => setRefunding(false)}
              onRefund={async (amount, reason) => {
                setBooking(await adminApi.refundFlightBooking(token, booking.id, { amount, reason }));
                setRefunding(false);
                setNotice("Refund sent to Razorpay.");
              }}
            />
          )}
        </>
      )}
    </>
  );
}
