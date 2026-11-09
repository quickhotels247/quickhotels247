"use client";

import { useEffect, useState, type ReactNode } from "react";
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
import BlockRounded from "@mui/icons-material/BlockRounded";
import CurrencyRupeeRounded from "@mui/icons-material/CurrencyRupeeRounded";
import RefreshRounded from "@mui/icons-material/RefreshRounded";
import type { AdminHotelBooking } from "@quickhotels/types/admin";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { HOTEL_STATUS, HotelStatusChip, PaymentStatusChip } from "@/components/admin/StatusChip";
import { routes } from "@/config/navigation";
import { adminApi } from "@/lib/api/admin";
import { useAdminAuth } from "@/lib/admin/AdminAuthProvider";
import { money, when } from "@/lib/admin/format";
import { formatShortDate } from "@/lib/dates";
import { useApiData } from "@/lib/hooks/useApiData";
import { useRequest } from "@/lib/hooks/useRequest";
import CancelHotelDialog from "../../components/CancelHotelDialog";
import RefundDialog from "../../components/RefundDialog";
import { extra, styles } from "./HotelBookingPage.styles";

const indiaTime = (local: string) => `${formatShortDate(local.slice(0, 10))} ${local.slice(11, 16)}`;
const statusLabel = (status: string | null) => (status ? (HOTEL_STATUS[status as keyof typeof HOTEL_STATUS]?.label ?? status) : "—");

// One hotel booking for staff: status and actions (re-check with TripJack,
// refund, cancel), the stay and guests, the money (paid, net, margin),
// cancellation terms and requests, payments and refunds, and the history.
export default function HotelBookingPage() {
  const { id } = useParams<{ id: string }>();
  const { token, admin } = useAdminAuth();
  const { data, error } = useApiData((signal) => adminApi.hotelBooking(token!, id, signal), [token, id]);
  const [booking, setBooking] = useState<AdminHotelBooking | null>(null);
  const [dialog, setDialog] = useState<"refund" | "cancel" | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const recheck = useRequest();
  useEffect(() => setBooking(data), [data]);

  const canMoveMoney = Boolean(admin?.permissions.includes("refunds"));
  const captured = booking?.payments.find((payment) => ["CAPTURED", "PARTIALLY_REFUNDED", "REFUNDED"].includes(payment.status));
  const refundedSoFar = captured?.refunds.filter((refund) => refund.status !== "FAILED").reduce((sum, refund) => sum + refund.amount.amount, 0) ?? 0;
  const refundable = captured ? Math.round((captured.amount.amount - refundedSoFar) * 100) / 100 : 0;

  const doRecheck = () =>
    void recheck.run(async () => {
      const result = await adminApi.recheckHotelBooking(token!, id);
      setBooking(result.booking);
      setNotice(`The supplier says: ${result.supplierStatus}.`);
    });

  const row = (label: string, value: ReactNode) => (
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
        <Typography sx={styles.crumb}>{booking?.reference ?? "Hotel booking"}</Typography>
      </Breadcrumbs>
      {error && <Alert severity="error">{error}</Alert>}
      {!booking && !error && <Skeleton variant="rounded" height={320} />}
      {booking && token && (
        <>
          <AdminPageHeader
            title={`${booking.reference} · ${booking.hotel}`}
            subtitle={`${formatShortDate(booking.checkIn)} – ${formatShortDate(booking.checkOut)} · ${booking.nights} night${booking.nights === 1 ? "" : "s"} · ${booking.rooms} room${booking.rooms === 1 ? "" : "s"}, ${booking.guests} guest${booking.guests === 1 ? "" : "s"}`}
            actions={
              <Box sx={styles.actions}>
                <Button variant="outlined" startIcon={<RefreshRounded />} onClick={doRecheck} disabled={recheck.busy || !booking.checkoutId}>
                  {recheck.busy ? "Checking…" : "Re-check with supplier"}
                </Button>
                {canMoveMoney && booking.status === "CONFIRMED" && (
                  <Button variant="outlined" color="error" startIcon={<BlockRounded />} onClick={() => setDialog("cancel")}>
                    Cancel booking
                  </Button>
                )}
                {canMoveMoney && refundable > 0 && (
                  <Button variant="contained" color="error" startIcon={<CurrencyRupeeRounded />} onClick={() => setDialog("refund")}>
                    Refund
                  </Button>
                )}
              </Box>
            }
          />
          {recheck.error && <Alert severity="error" sx={styles.alert}>{recheck.error}</Alert>}
          {notice && <Alert severity="info" onClose={() => setNotice(null)} sx={styles.alert}>{notice}</Alert>}
          {booking.status === "SUPPLIER_BOOKING_FAILED" && <Alert severity="error" sx={styles.alert}>The hotel couldn&apos;t confirm this booking. Check the refund below.</Alert>}
          {booking.opsAlertedAt && (booking.status === "PAYMENT_PENDING" || booking.status === "SUPPLIER_BOOKING_PENDING") && (
            <Alert severity="warning" sx={styles.alert}>Still not confirmed; the team was alerted {when(booking.opsAlertedAt)}.</Alert>
          )}

          <Box sx={styles.grid}>
            <Box sx={styles.col}>
              <Box sx={styles.card}>
                <Box sx={styles.cardHead}>
                  <Typography component="h2" sx={styles.h2}>Status</Typography>
                  <HotelStatusChip status={booking.status} />
                </Box>
                {row("Booked", when(booking.createdAt))}
                {row("Confirmed", when(booking.confirmedAt))}
                {booking.cancelledAt && row("Cancelled", when(booking.cancelledAt))}
                {row("Last update", when(booking.updatedAt))}
                {row("Hotel conf. no.", booking.supplierConfirmation ? <b>{booking.supplierConfirmation}</b> : "—")}
                {row(`${booking.supplier} booking`, booking.supplierBookingId ? <Box component="span" sx={styles.mono}>{booking.supplierBookingId}</Box> : "—")}
              </Box>
              <Box sx={styles.card}>
                <Typography component="h2" sx={styles.h2}>Stay</Typography>
                <Typography sx={styles.legTitle}>{booking.hotel}</Typography>
                <Typography sx={styles.small}>{[booking.address, booking.city].filter(Boolean).join(", ") || "—"}</Typography>
                <Divider sx={styles.divider} />
                {booking.roomsBooked.map((room, i) => (
                  <Box key={i} sx={styles.leg}>
                    <Typography sx={styles.legTitle}>Room {i + 1}: {room.name}{room.mealPlan ? ` · ${room.mealPlan}` : ""}</Typography>
                    {room.guests.map((guest) => (
                      <Typography key={guest} sx={styles.small}>{guest}</Typography>
                    ))}
                  </Box>
                ))}
                {booking.specialRequests && row("Requests", booking.specialRequests)}
                <Divider sx={styles.divider} />
                {row("Email", <MuiLink href={`mailto:${booking.email}`}>{booking.email}</MuiLink>)}
                {row("Phone", booking.phone)}
              </Box>
              <Box sx={styles.card}>
                <Typography component="h2" sx={styles.h2}>History</Typography>
                {booking.history.map((entry, i) => (
                  <Box key={i} sx={extra.history}>
                    <Typography sx={styles.small}>{when(entry.at)}</Typography>
                    <Typography sx={styles.v}>
                      <b>{statusLabel(entry.to)}</b>
                      <Box component="span" sx={styles.small}> · {entry.source}{entry.reason ? ` · ${entry.reason}` : ""}</Box>
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Box>
            <Box sx={styles.col}>
              <Box sx={styles.card}>
                <Typography component="h2" sx={styles.h2}>Money</Typography>
                {row("Customer paid", <b>{money(booking.money.customerTotal)}</b>)}
                {row("Coupon", booking.money.coupon ? `${booking.money.coupon.code} −${money(booking.money.coupon.discount)}` : "—")}
                {row("Supplier net", money(booking.money.supplierNet))}
                {row("Markup", money(booking.money.markup))}
                {row("Our margin", booking.money.margin ? <Box component="span" sx={booking.money.margin.amount < 0 ? styles.loss : styles.gain}>{money(booking.money.margin)}</Box> : "—")}
                {row("Markup rule", booking.money.ruleVersion ? `v${booking.money.ruleVersion}` : "None")}
                {booking.refunded && row("Refunded", <Box component="span" sx={styles.refunded}>{money(booking.refunded)}</Box>)}
              </Box>
              <Box sx={styles.card}>
                <Typography component="h2" sx={styles.h2}>Cancellation</Typography>
                {!booking.policy ? (
                  <Typography sx={styles.small}>No policy saved.</Typography>
                ) : (
                  <>
                    <Typography sx={styles.small}>
                      {booking.policy.freeCancellationUntil ? `Free until ${indiaTime(booking.policy.freeCancellationUntil)} (India)` : booking.policy.refundable ? "Refundable with charges" : "Non-refundable"}
                    </Typography>
                    {booking.policy.charges.filter((charge) => charge.amount.amount > 0).map((charge) => (
                      <Typography key={charge.from} sx={styles.small}>From {indiaTime(charge.from)}: {money(charge.amount)}</Typography>
                    ))}
                  </>
                )}
                {booking.cancelQuote && booking.status === "CONFIRMED" && row("If cancelled now", `fee ${money(booking.cancelQuote.fee)} · refund ${money(booking.cancelQuote.refund)}`)}
                {booking.cancellations.map((item) => (
                  <Box key={item.requestedAt} sx={styles.refund}>
                    <Box sx={styles.cardHead}>
                      <Typography sx={styles.small}>Requested by {item.requestedBy} · {when(item.requestedAt)}</Typography>
                      <PaymentStatusChip status={item.status} />
                    </Box>
                    <Typography sx={styles.small}>
                      Fee {money(item.fee)} · refund {money(item.refundEstimate)}{item.reason ? ` · ${item.reason}` : ""}
                    </Typography>
                  </Box>
                ))}
              </Box>
              <Box sx={styles.card}>
                <Typography component="h2" sx={styles.h2}>Payments</Typography>
                {booking.payments.length === 0 && <Typography sx={styles.small}>No payment linked.</Typography>}
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
          {canMoveMoney && (
            <>
              <RefundDialog
                open={dialog === "refund"}
                refundable={refundable}
                warning={booking.status === "CONFIRMED" ? "This booking is still confirmed with the hotel. A refund only returns money; use “Cancel booking” to cancel the stay." : null}
                onClose={() => setDialog(null)}
                onRefund={async (amount, reason) => {
                  setBooking(await adminApi.refundHotelBooking(token, booking.id, { amount, reason }));
                  setDialog(null);
                  setNotice("Refund sent to Razorpay.");
                }}
              />
              <CancelHotelDialog
                open={dialog === "cancel"}
                booking={booking}
                onClose={() => setDialog(null)}
                onCancel={async (request) => {
                  setBooking(await adminApi.cancelHotelBooking(token, booking.id, request));
                  setDialog(null);
                  setNotice("Cancellation sent to the hotel. The refund follows once it's cancelled; use Re-check to update.");
                }}
              />
            </>
          )}
        </>
      )}
    </>
  );
}
