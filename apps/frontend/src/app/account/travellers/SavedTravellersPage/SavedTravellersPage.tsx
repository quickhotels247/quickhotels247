"use client";

import { useEffect, useState } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Skeleton from "@mui/material/Skeleton";
import Typography from "@mui/material/Typography";
import GroupOutlined from "@mui/icons-material/GroupOutlined";
import PersonAddAlt1Outlined from "@mui/icons-material/PersonAddAlt1Outlined";
import type { SavedTraveller } from "@quickhotels/types/travellers";
import RequireAuth from "@/components/auth/RequireAuth";
import { travellersApi } from "@/lib/api/auth";
import { useAuth } from "@/lib/auth/useAuth";
import { useApiData } from "@/lib/hooks/useApiData";
import { useRequest } from "@/lib/hooks/useRequest";
import AccountTabs from "../../components/AccountTabs";
import TravellerDialog from "../components/TravellerDialog";
import TravellerRow from "../components/TravellerRow";
import { styles } from "./SavedTravellersPage.styles";

// Must match MAX_SAVED_TRAVELLERS on the backend.
const MAX_TRAVELLERS = 20;

export default function SavedTravellersPage() {
  return (
    <RequireAuth>
      <SavedTravellers />
    </RequireAuth>
  );
}

const sortByName = (list: SavedTraveller[]) => [...list].sort((a, b) => a.firstName.localeCompare(b.firstName));

function SavedTravellers() {
  const { token } = useAuth();
  const { data, error } = useApiData((signal) => travellersApi.list(token!, signal), [token]);
  const [travellers, setTravellers] = useState<SavedTraveller[] | null>(null);
  // undefined: closed; null: adding; a traveller: editing.
  const [editing, setEditing] = useState<SavedTraveller | null | undefined>(undefined);
  const [removing, setRemoving] = useState<SavedTraveller | null>(null);
  const remove = useRequest();
  useEffect(() => setTravellers(data), [data]);

  if (!token) return null;
  const full = (travellers?.length ?? 0) >= MAX_TRAVELLERS;

  function confirmRemove() {
    const target = removing;
    if (!target) return;
    void remove.run(async () => {
      await travellersApi.remove(token!, target.id);
      setTravellers((list) => list?.filter((item) => item.id !== target.id) ?? null);
      setRemoving(null);
    });
  }

  return (
    <Container maxWidth="md" sx={styles.root}>
      <Typography component="h1" sx={styles.title}>
        Saved travellers
      </Typography>
      <AccountTabs />
      <Box sx={styles.head}>
        <Typography sx={styles.subtitle}>People you often book for. Save them once and fill their details at checkout.</Typography>
        <Button variant="contained" startIcon={<PersonAddAlt1Outlined />} onClick={() => setEditing(null)} disabled={!travellers || full} sx={styles.add}>
          Add traveller
        </Button>
      </Box>
      {full && <Alert severity="info">You&apos;ve saved {MAX_TRAVELLERS} travellers, the most allowed. Remove one to add another.</Alert>}
      {error && <Alert severity="error">{error}</Alert>}
      {!travellers && !error && [0, 1].map((i) => <Skeleton key={i} variant="rounded" height={84} sx={styles.skeleton} />)}
      {travellers?.length === 0 && (
        <Box sx={styles.empty}>
          <GroupOutlined sx={styles.emptyIcon} />
          <Typography sx={styles.emptyTitle}>No saved travellers yet</Typography>
          <Typography sx={styles.subtitle}>Add family and friends you travel with to book faster.</Typography>
        </Box>
      )}
      {travellers?.map((traveller) => (
        <TravellerRow key={traveller.id} traveller={traveller} onEdit={() => setEditing(traveller)} onRemove={() => setRemoving(traveller)} />
      ))}

      <TravellerDialog
        open={editing !== undefined}
        token={token}
        traveller={editing ?? null}
        onClose={() => setEditing(undefined)}
        onSaved={(saved) => {
          setTravellers((list) => sortByName([...(list ?? []).filter((item) => item.id !== saved.id), saved]));
          setEditing(undefined);
        }}
      />
      <Dialog open={Boolean(removing)} onClose={remove.busy ? undefined : () => setRemoving(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Remove traveller?</DialogTitle>
        <DialogContent>
          {remove.error && <Alert severity="error" sx={styles.removeError}>{remove.error}</Alert>}
          <Typography>
            {removing?.firstName} {removing?.lastName} will be removed from your saved travellers. Existing bookings aren&apos;t affected.
          </Typography>
        </DialogContent>
        <DialogActions sx={styles.actions}>
          <Button onClick={() => setRemoving(null)} disabled={remove.busy}>
            Cancel
          </Button>
          <Button color="error" variant="contained" onClick={confirmRemove} disabled={remove.busy}>
            {remove.busy ? "Removing…" : "Remove"}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
