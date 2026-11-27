"use client";

import { useEffect, useState } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Skeleton from "@mui/material/Skeleton";
import Typography from "@mui/material/Typography";
import AddRounded from "@mui/icons-material/AddRounded";
import type { Promotion } from "@quickhotels/types/pricing";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { adminApi } from "@/lib/api/admin";
import { useAdminAuth } from "@/lib/admin/AdminAuthProvider";
import { useApiData } from "@/lib/hooks/useApiData";
import { useRequest } from "@/lib/hooks/useRequest";
import PromotionDialog from "../components/PromotionDialog";
import PromotionRow from "../components/PromotionRow";
import { styles } from "./PromotionsPage.styles";

// Automatic discounts on all hotels: shown as the regular price crossed out
// and "X% off", taken only out of our markup.
export default function PromotionsPage() {
  const { token } = useAdminAuth();
  const { data, error } = useApiData((signal) => adminApi.promotions(token!, signal), [token]);
  const [promotions, setPromotions] = useState<Promotion[] | null>(null);
  const [editing, setEditing] = useState<Promotion | null | undefined>(undefined);
  const [deleting, setDeleting] = useState<Promotion | null>(null);
  const remove = useRequest();
  useEffect(() => setPromotions(data), [data]);

  function confirmDelete() {
    const promotion = deleting;
    if (!promotion || !token) return;
    void remove.run(async () => {
      setPromotions(await adminApi.deletePromotion(token, promotion.id));
      setDeleting(null);
    });
  }

  return (
    <>
      <AdminPageHeader
        title="Promotions"
        subtitle="Automatic discounts on every hotel, no code needed. Changes reach new searches at once."
        actions={
          <Button variant="contained" startIcon={<AddRounded />} onClick={() => setEditing(null)} disabled={!promotions}>
            New promotion
          </Button>
        }
      />
      <Alert severity="info" sx={styles.info}>
        Customers see the <b>regular price crossed out</b> (TripJack&apos;s price + your markup) and the price after the promotion, with &ldquo;X% off&rdquo;. A promotion only comes out of your <b>markup</b>, so a price never goes below TripJack&apos;s net; with a 9% markup, at most about 8% can come off. Coupons at checkout then take off what&apos;s left of the markup. If several promotions are running, the newest one applies.
      </Alert>
      {error && <Alert severity="error">{error}</Alert>}
      <Box sx={styles.card}>
        {!promotions && !error && <Skeleton variant="rounded" height={56} />}
        {promotions?.length === 0 && <Typography sx={styles.empty}>No promotions yet: hotels sell at their regular price.</Typography>}
        {promotions?.map((promotion) => (
          <PromotionRow key={promotion.id} promotion={promotion} onEdit={() => setEditing(promotion)} onDelete={() => setDeleting(promotion)} />
        ))}
      </Box>
      {token && (
        <PromotionDialog
          open={editing !== undefined}
          token={token}
          promotion={editing ?? null}
          onClose={() => setEditing(undefined)}
          onSaved={(next) => {
            setPromotions(next);
            setEditing(undefined);
          }}
        />
      )}
      <Dialog open={Boolean(deleting)} onClose={remove.busy ? undefined : () => setDeleting(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Delete this promotion?</DialogTitle>
        <DialogContent>
          {remove.error && <Alert severity="error" sx={styles.deleteError}>{remove.error}</Alert>}
          <Typography>
            &ldquo;{deleting?.name}&rdquo; stops lowering prices for new searches. Checkouts already started keep their price. To pause it instead, edit it and set it to Off.
          </Typography>
        </DialogContent>
        <DialogActions sx={styles.actions}>
          <Button onClick={() => setDeleting(null)} disabled={remove.busy}>
            Cancel
          </Button>
          <Button color="error" variant="contained" onClick={confirmDelete} disabled={remove.busy}>
            {remove.busy ? "Deleting…" : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
