"use client";

import { useState, type FormEvent } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Collapse from "@mui/material/Collapse";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import LocalOfferOutlined from "@mui/icons-material/LocalOfferOutlined";
import type { AppliedCoupon } from "@quickhotels/types/coupons";
import { useAuth } from "@/lib/auth/useAuth";
import { formatPrice } from "@/lib/format";
import { useRequest } from "@/lib/hooks/useRequest";
import { styles } from "./CouponBox.styles";

interface CouponBoxProps {
  coupon: AppliedCoupon | null;
  onApply: (code: string, token: string | null) => Promise<void>;
  onRemove: () => Promise<void>;
  // After payment has started, the coupon can't change.
  disabled?: boolean;
}

// "Have a coupon?": enter a code; once applied, shows it with Remove.
export default function CouponBox({ coupon, onApply, onRemove, disabled = false }: CouponBoxProps) {
  const { token } = useAuth();
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");
  const { busy, error, setError, run } = useRequest();

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void run(async () => {
      await onApply(code.trim().toUpperCase(), token);
      setCode("");
      setOpen(false);
    });
  }

  if (coupon) {
    return (
      <Box sx={styles.applied}>
        <LocalOfferOutlined fontSize="small" color="success" />
        <Typography sx={styles.appliedText}>
          <b>{coupon.code}</b> applied · you save {formatPrice(coupon.discount)}
        </Typography>
        {!disabled && (
          <Button size="small" onClick={() => void run(onRemove)} disabled={busy}>
            Remove
          </Button>
        )}
      </Box>
    );
  }
  if (disabled) return null;
  return (
    <Box sx={styles.root}>
      {!open && (
        <Button size="small" startIcon={<LocalOfferOutlined fontSize="small" />} onClick={() => setOpen(true)} sx={styles.toggle}>
          Have a coupon code?
        </Button>
      )}
      <Collapse in={open} unmountOnExit>
        <Box component="form" onSubmit={submit} sx={styles.form}>
          <TextField
            size="small"
            label="Coupon code"
            value={code}
            onChange={(event) => {
              setCode(event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""));
              setError("");
            }}
            error={Boolean(error)}
            helperText={error || " "}
            disabled={busy}
            autoFocus
            slotProps={{ htmlInput: { maxLength: 20, autoCapitalize: "characters", spellCheck: false } }}
            sx={styles.field}
          />
          <Button type="submit" variant="outlined" disabled={busy || code.length < 3} sx={styles.apply}>
            {busy ? "Checking…" : "Apply"}
          </Button>
        </Box>
      </Collapse>
    </Box>
  );
}
