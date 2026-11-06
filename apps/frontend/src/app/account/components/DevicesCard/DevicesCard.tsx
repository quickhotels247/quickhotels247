"use client";

import { useEffect, useState } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Skeleton from "@mui/material/Skeleton";
import Typography from "@mui/material/Typography";
import DevicesOutlined from "@mui/icons-material/DevicesOutlined";
import type { AccountSession } from "@quickhotels/types/users";
import { accountApi } from "@/lib/api/auth";
import { useApiData } from "@/lib/hooks/useApiData";
import { useRequest } from "@/lib/hooks/useRequest";
import { styles } from "./DevicesCard.styles";

const when = (iso: string) => new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" });

// Where the customer is signed in, with sign-out per device or everywhere else.
export default function DevicesCard({ token }: { token: string }) {
  const { data, error } = useApiData((signal) => accountApi.sessions(token, signal), [token]);
  const [sessions, setSessions] = useState<AccountSession[] | null>(null);
  const action = useRequest();
  useEffect(() => setSessions(data), [data]);
  const others = sessions?.filter((session) => !session.current) ?? [];

  const signOut = (id: string) =>
    void action.run(async () => {
      await accountApi.signOutSession(token, id);
      setSessions((list) => list?.filter((session) => session.id !== id) ?? null);
    });
  const signOutOthers = () =>
    void action.run(async () => {
      await accountApi.signOutOthers(token);
      setSessions((list) => list?.filter((session) => session.current) ?? null);
    });

  return (
    <Box component="section" aria-labelledby="devices-title" sx={styles.root}>
      <Box sx={styles.head}>
        <Box>
          <Typography component="h2" id="devices-title" sx={styles.title}>
            Signed-in devices
          </Typography>
          <Typography sx={styles.subtitle}>Sign out anywhere you don&apos;t recognise.</Typography>
        </Box>
        {others.length > 0 && (
          <Button variant="outlined" size="small" onClick={signOutOthers} disabled={action.busy} sx={styles.all}>
            Sign out all other devices
          </Button>
        )}
      </Box>
      {(error || action.error) && <Alert severity="error">{error || action.error}</Alert>}
      {!sessions && !error && <Skeleton variant="rounded" height={64} />}
      {sessions?.map((session) => (
        <Box key={session.id} sx={styles.row}>
          <DevicesOutlined sx={styles.icon} />
          <Box sx={styles.text}>
            <Typography sx={styles.device}>
              {session.device ?? "Unknown device"}
              {session.current && <Chip label="This device" size="small" color="success" variant="outlined" sx={styles.chip} />}
            </Typography>
            <Typography sx={styles.meta}>
              Signed in {when(session.createdAt)} · Last active {when(session.lastUsedAt)}
            </Typography>
          </Box>
          {!session.current && (
            <Button size="small" onClick={() => signOut(session.id)} disabled={action.busy}>
              Sign out
            </Button>
          )}
        </Box>
      ))}
    </Box>
  );
}
