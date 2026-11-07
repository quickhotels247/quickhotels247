"use client";

import { useState, type FormEvent } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import type { AdminTicket } from "@quickhotels/types/support";
import { adminApi } from "@/lib/api/admin";
import { useRequest } from "@/lib/hooks/useRequest";
import { styles } from "./NoteComposer.styles";

interface NoteComposerProps {
  token: string;
  ticket: AdminTicket;
  onSaved: (ticket: AdminTicket) => void;
}

// Reply to the customer (emailed) or add a staff-only note.
export default function NoteComposer({ token, ticket, onSaved }: NoteComposerProps) {
  const [kind, setKind] = useState<"reply" | "note">("reply");
  const [body, setBody] = useState("");
  const { busy, error, run } = useRequest();

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void run(async () => {
      onSaved(await adminApi.addTicketNote(token, ticket.id, { kind, body: body.trim() }));
      setBody("");
    });
  }

  return (
    <Box component="form" onSubmit={submit} sx={styles.root}>
      <ToggleButtonGroup exclusive size="small" value={kind} onChange={(_, next) => next && setKind(next)} aria-label="Reply or note">
        <ToggleButton value="reply">Reply to customer</ToggleButton>
        <ToggleButton value="note">Internal note</ToggleButton>
      </ToggleButtonGroup>
      {error && <Alert severity="error">{error}</Alert>}
      <TextField
        multiline
        minRows={4}
        value={body}
        onChange={(event) => setBody(event.target.value)}
        placeholder={kind === "reply" ? `Write to ${ticket.name ?? ticket.email}…` : "Only staff see notes."}
        disabled={busy}
        slotProps={{ htmlInput: { maxLength: 4000, "aria-label": kind === "reply" ? "Reply" : "Note" } }}
        sx={kind === "note" ? styles.noteField : undefined}
      />
      <Box sx={styles.footer}>
        <Box component="span" sx={styles.hint}>
          {kind === "reply" ? `Emailed to ${ticket.email}; the request moves to "Waiting on customer".` : "Not sent to the customer."}
        </Box>
        <Button type="submit" variant="contained" disabled={busy || body.trim().length < 2}>
          {busy ? "Saving…" : kind === "reply" ? "Send reply" : "Add note"}
        </Button>
      </Box>
    </Box>
  );
}
