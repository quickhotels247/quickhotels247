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
import type { PricingProduct, PricingRule } from "@quickhotels/types/pricing";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { adminApi } from "@/lib/api/admin";
import { useAdminAuth } from "@/lib/admin/AdminAuthProvider";
import { useApiData } from "@/lib/hooks/useApiData";
import { useRequest } from "@/lib/hooks/useRequest";
import PricingRuleDialog from "../components/PricingRuleDialog";
import PricingRuleRow from "../components/PricingRuleRow";
import { styles } from "./PricingPage.styles";

const PRODUCTS: { product: PricingProduct; title: string; empty: string }[] = [
  { product: "HOTEL", title: "Hotels", empty: "No hotel markup yet: rooms sell at TripJack's net price." },
  { product: "FLIGHT", title: "Flights", empty: "No flight markup yet: fares sell at TripJack's net price." },
];

// Markup rules (spec §5.8): our margin on top of supplier net prices.
export default function PricingPage() {
  const { token } = useAdminAuth();
  const { data, error } = useApiData((signal) => adminApi.pricingRules(token!, signal), [token]);
  const [rules, setRules] = useState<PricingRule[] | null>(null);
  // undefined: closed; otherwise editing a rule or adding one for a product.
  const [editing, setEditing] = useState<{ rule: PricingRule | null; product: PricingProduct } | undefined>(undefined);
  const [deleting, setDeleting] = useState<PricingRule | null>(null);
  const remove = useRequest();
  useEffect(() => setRules(data), [data]);

  function confirmDelete() {
    const rule = deleting;
    if (!rule || !token) return;
    void remove.run(async () => {
      setRules(await adminApi.deletePricingRule(token, rule.id));
      setDeleting(null);
    });
  }

  return (
    <>
      <AdminPageHeader title="Pricing & markup" subtitle="What you add on top of TripJack's net price. Changes apply to new searches within a minute." />
      <Alert severity="info" sx={styles.info}>
        For each price, the active rule with the <b>highest priority</b> applies; on a tie, the more specific one (destination, then airline or country, then all). Only one rule applies. Selling prices are rounded up to whole rupees, and every checkout records the rule and version it used.
      </Alert>
      {error && <Alert severity="error">{error}</Alert>}
      {PRODUCTS.map(({ product, title, empty }) => {
        const list = rules?.filter((rule) => rule.product === product) ?? [];
        return (
          <Box key={product} component="section" sx={styles.card} aria-labelledby={`rules-${product}`}>
            <Box sx={styles.head}>
              <Typography component="h2" id={`rules-${product}`} sx={styles.title}>
                {title}
              </Typography>
              <Button startIcon={<AddRounded />} variant="outlined" size="small" onClick={() => setEditing({ rule: null, product })} disabled={!rules}>
                Add rule
              </Button>
            </Box>
            {!rules && !error && <Skeleton variant="rounded" height={56} />}
            {rules && list.length === 0 && <Typography sx={styles.empty}>{empty}</Typography>}
            {list.map((rule) => (
              <PricingRuleRow key={rule.id} rule={rule} onEdit={() => setEditing({ rule, product })} onDelete={() => setDeleting(rule)} />
            ))}
          </Box>
        );
      })}

      {token && (
        <PricingRuleDialog
          open={editing !== undefined}
          token={token}
          rule={editing?.rule ?? null}
          product={editing?.product ?? "HOTEL"}
          onClose={() => setEditing(undefined)}
          onSaved={(next) => {
            setRules(next);
            setEditing(undefined);
          }}
        />
      )}
      <Dialog open={Boolean(deleting)} onClose={remove.busy ? undefined : () => setDeleting(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Delete this rule?</DialogTitle>
        <DialogContent>
          {remove.error && <Alert severity="error" sx={styles.deleteError}>{remove.error}</Alert>}
          <Typography>
            &ldquo;{deleting?.name}&rdquo; stops applying to new prices. Checkouts already started keep their price. To pause it instead, edit it and set it to Off.
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
