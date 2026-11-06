"use client";

import { useEffect, useState } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Skeleton from "@mui/material/Skeleton";
import Switch from "@mui/material/Switch";
import Typography from "@mui/material/Typography";
import type { NotificationPreferences } from "@quickhotels/types/users";
import { accountApi } from "@/lib/api/auth";
import { useAuth } from "@/lib/auth/useAuth";
import { useApiData } from "@/lib/hooks/useApiData";
import { useRequest } from "@/lib/hooks/useRequest";
import AccountShell from "../../components/AccountShell";
import { styles } from "./PreferencesPage.styles";

const OPTIONS: { key: keyof NotificationPreferences; title: string; description: string }[] = [
  { key: "dealsEmails", title: "Deals and offers", description: "Discounts, weekend deals and coupon codes. At most a few emails a month." },
  { key: "tripReminders", title: "Trip reminders", description: "Check-in details and reminders before your stay or flight." },
  { key: "reviewRequests", title: "Review requests", description: "After your stay, a short email asking how it went." },
];

// Email choices; each switch saves at once. Booking emails always go out.
export default function PreferencesPage() {
  return (
    <AccountShell title="Email preferences" subtitle="Choose which emails you get from QuickHotels24/7.">
      <Preferences />
    </AccountShell>
  );
}

// Inside the shell, so it only loads once signed in.
function Preferences() {
  const { token } = useAuth();
  const { data, error } = useApiData((signal) => accountApi.preferences(token!, signal), [token]);
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [saved, setSaved] = useState(false);
  const save = useRequest();
  useEffect(() => setPreferences(data), [data]);

  function toggle(key: keyof NotificationPreferences, value: boolean) {
    if (!preferences || !token) return;
    const previous = preferences;
    const next = { ...preferences, [key]: value };
    setPreferences(next);
    setSaved(false);
    void save.run(async () => {
      try {
        await accountApi.setPreferences(token, next);
        setSaved(true);
      } catch (caught) {
        setPreferences(previous);
        throw caught;
      }
    });
  }

  return (
    <>
      {(error || save.error) && <Alert severity="error">{error || save.error}</Alert>}
      {saved && !save.busy && <Alert severity="success">Your preferences are saved.</Alert>}
      <Box component="section" aria-label="Email choices" sx={styles.card}>
        {!preferences && !error && <Skeleton variant="rounded" height={160} />}
        {preferences &&
          OPTIONS.map((option) => (
            <Box key={option.key} sx={styles.row}>
              <Box sx={styles.text}>
                <Typography id={`pref-${option.key}`} sx={styles.title}>
                  {option.title}
                </Typography>
                <Typography sx={styles.description}>{option.description}</Typography>
              </Box>
              <Switch
                checked={preferences[option.key]}
                onChange={(event) => toggle(option.key, event.target.checked)}
                disabled={save.busy}
                slotProps={{ input: { "aria-labelledby": `pref-${option.key}` } }}
              />
            </Box>
          ))}
      </Box>
      <Typography sx={styles.note}>
        Booking confirmations, changes, cancellations and receipts are always sent, as they&apos;re part of your booking.
      </Typography>
    </>
  );
}
