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
import type { Coupon } from "@quickhotels/types/coupons";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { adminApi } from "@/lib/api/admin";
import { useAdminAuth } from "@/lib/admin/AdminAuthProvider";
import { useApiData } from "@/lib/hooks/useApiData";
import { useRequest } from "@/lib/hooks/useRequest";
import CouponDialog from "../components/CouponDialog";
import CouponRow from "../components/CouponRow";
import { styles } from "./CouponsPage.styles";

// Coupon codes (spec §5.8): customers enter them at checkout; public ones show on Home.
export default function CouponsPage() {
  const { token } = useAdminAuth();
  const { data, error } = useApiData((signal) => adminApi.coupons(token!, signal), [token]);
  const [coupons, setCoupons] = useState<Coupon[] | null>(null);
  const [editing, setEditing] = useState<Coupon | null | undefined>(undefined);
  const [deleting, setDeleting] = useState<Coupon | null>(null);
  const remove = useRequest();
  useEffect(() => setCoupons(data), [data]);

  function confirmDelete() {
    const coupon = deleting;
    if (!coupon || !token) return;
    void remove.run(async () => {
      setCoupons(await adminApi.deleteCoupon(token, coupon.id));
      setDeleting(null);
    });
  }

  return (
    <>
      <AdminPageHeader
        title="Coupons"
        subtitle="Discount codes for checkout. Public ones appear in the Home page Offers."
        actions={
          <Button variant="contained" startIcon={<AddRounded />} onClick={() => setEditing(null)} disabled={!coupons}>
            New coupon
          </Button>
        }
      />
      {error && <Alert severity="error">{error}</Alert>}
      <Box sx={styles.card}>
        {!coupons && !error && <Skeleton variant="rounded" height={64} />}
        {coupons?.length === 0 && <Typography sx={styles.empty}>No coupons yet.</Typography>}
        {coupons?.map((coupon) => (
          <CouponRow key={coupon.id} coupon={coupon} onEdit={() => setEditing(coupon)} onDelete={() => setDeleting(coupon)} />
        ))}
      </Box>
      {token && (
        <CouponDialog
          open={editing !== undefined}
          token={token}
          coupon={editing ?? null}
          onClose={() => setEditing(undefined)}
          onSaved={(next) => {
            setCoupons(next);
            setEditing(undefined);
          }}
        />
      )}
      <Dialog open={Boolean(deleting)} onClose={remove.busy ? undefined : () => setDeleting(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Delete {deleting?.code}?</DialogTitle>
        <DialogContent>
          {remove.error && <Alert severity="error" sx={styles.deleteError}>{remove.error}</Alert>}
          <Typography>The code stops working at checkout. Checkouts that already applied it keep their discount.</Typography>
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
