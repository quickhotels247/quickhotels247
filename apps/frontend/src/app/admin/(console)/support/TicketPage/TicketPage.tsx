"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Breadcrumbs from "@mui/material/Breadcrumbs";
import Button from "@mui/material/Button";
import MuiLink from "@mui/material/Link";
import MenuItem from "@mui/material/MenuItem";
import Skeleton from "@mui/material/Skeleton";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import type { AdminTicket, TicketStatus } from "@quickhotels/types/support";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { routes } from "@/config/navigation";
import { adminApi } from "@/lib/api/admin";
import { useAdminAuth } from "@/lib/admin/AdminAuthProvider";
import { useApiData } from "@/lib/hooks/useApiData";
import { useRequest } from "@/lib/hooks/useRequest";
import NoteComposer from "../components/NoteComposer";
import TicketStatusChip from "../components/TicketStatusChip";
import { STATUS_LABEL, STATUSES, topicText, when } from "../utils/ticketText";
import { styles } from "./TicketPage.styles";

// One support request: the customer's message, status, assignment, and the
// thread of replies (emailed) and staff notes.
export default function TicketPage() {
  const { id } = useParams<{ id: string }>();
  const { token, admin } = useAdminAuth();
  const { data, error } = useApiData((signal) => adminApi.ticket(token!, id, signal), [token, id]);
  const [ticket, setTicket] = useState<AdminTicket | null>(null);
  const update = useRequest();
  useEffect(() => setTicket(data), [data]);

  const change = (changes: { status?: TicketStatus; assignToMe?: boolean }) =>
    void update.run(async () => setTicket(await adminApi.updateTicket(token!, id, changes)));

  return (
    <>
      <Breadcrumbs sx={styles.crumbs}>
        <MuiLink component={Link} href={routes.adminSupport} underline="hover" color="inherit">
          Support
        </MuiLink>
        <Typography sx={styles.crumb}>{ticket?.reference ?? "Request"}</Typography>
      </Breadcrumbs>
      {error && <Alert severity="error">{error}</Alert>}
      {!ticket && !error && <Skeleton variant="rounded" height={260} />}
      {ticket && token && (
        <>
          <AdminPageHeader title={`${ticket.reference} · ${topicText(ticket.topic)}`} subtitle={`From ${ticket.name ?? ticket.email}, ${when(ticket.createdAt)}`} />
          {update.error && <Alert severity="error" sx={styles.alert}>{update.error}</Alert>}
          <Box sx={styles.layout}>
            <Box sx={styles.main}>
              <Box sx={styles.card}>
                <Typography sx={styles.label}>Customer&apos;s message</Typography>
                <Typography sx={styles.message}>{ticket.message}</Typography>
              </Box>
              {ticket.notes.map((note) => (
                <Box key={note.id} sx={[styles.card, note.kind === "note" && styles.note]}>
                  <Typography sx={styles.label}>
                    {note.kind === "reply" ? "Reply sent" : "Internal note"} · {note.adminName ?? "Admin"} · {when(note.createdAt)}
                  </Typography>
                  <Typography sx={styles.message}>{note.body}</Typography>
                </Box>
              ))}
              <Box sx={styles.card}>
                <NoteComposer token={token} ticket={ticket} onSaved={setTicket} />
              </Box>
            </Box>
            <Box component="aside" sx={[styles.card, styles.side]}>
              <Box sx={styles.sideRow}>
                <TicketStatusChip status={ticket.status} />
              </Box>
              <TextField select size="small" label="Status" value={ticket.status} onChange={(event) => change({ status: event.target.value as TicketStatus })} disabled={update.busy}>
                {STATUSES.map((value) => (
                  <MenuItem key={value} value={value}>
                    {STATUS_LABEL[value]}
                  </MenuItem>
                ))}
              </TextField>
              <Box>
                <Typography sx={styles.label}>Assigned to</Typography>
                <Typography sx={styles.value}>{ticket.assignedTo ?? "Nobody"}</Typography>
                {ticket.assignedTo === admin?.name ? (
                  <Button size="small" onClick={() => change({ assignToMe: false })} disabled={update.busy}>Unassign</Button>
                ) : (
                  <Button size="small" onClick={() => change({ assignToMe: true })} disabled={update.busy}>Assign to me</Button>
                )}
              </Box>
              <Box>
                <Typography sx={styles.label}>Contact</Typography>
                <Typography sx={styles.value}>
                  <MuiLink href={`mailto:${ticket.email}`}>{ticket.email}</MuiLink>
                </Typography>
                {ticket.phone && <Typography sx={styles.value}>{ticket.phone}</Typography>}
                <Typography sx={styles.small}>{ticket.userId ? "Signed-in customer" : "Guest"}</Typography>
              </Box>
              {ticket.bookingReference && (
                <Box>
                  <Typography sx={styles.label}>Booking</Typography>
                  <Typography sx={styles.value}>{ticket.bookingReference}</Typography>
                  <Typography sx={styles.small}>{ticket.bookingFound ? "Matches this customer's booking" : "Not found for this customer: check the reference"}</Typography>
                </Box>
              )}
            </Box>
          </Box>
        </>
      )}
    </>
  );
}
