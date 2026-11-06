"use client";

import { useEffect, useState } from "react";
import Alert from "@mui/material/Alert";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Skeleton from "@mui/material/Skeleton";
import Typography from "@mui/material/Typography";
import PersonAddAlt1Outlined from "@mui/icons-material/PersonAddAlt1Outlined";
import type { AdminAccount } from "@quickhotels/types/admin";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { adminApi } from "@/lib/api/admin";
import { useAdminAuth } from "@/lib/admin/AdminAuthProvider";
import { useApiData } from "@/lib/hooks/useApiData";
import AddAdminDialog from "../components/AddAdminDialog";
import { styles } from "./TeamPage.styles";

const when = (iso: string | null) => (iso ? new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" }) : "Never");

// The admin team (spec §5.11): who can sign in to the console, and adding people.
export default function TeamPage() {
  const { admin: me, token } = useAdminAuth();
  const { data, error } = useApiData((signal) => adminApi.admins(token!, signal), [token]);
  const [admins, setAdmins] = useState<AdminAccount[] | null>(null);
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState<string | null>(null);
  useEffect(() => setAdmins(data), [data]);

  return (
    <>
      <AdminPageHeader
        title="Admin team"
        subtitle="Everyone who can sign in to this console."
        actions={
          <Button variant="contained" startIcon={<PersonAddAlt1Outlined />} onClick={() => setAdding(true)}>
            Add admin
          </Button>
        }
      />
      {added && (
        <Alert severity="success" onClose={() => setAdded(null)} sx={styles.alert}>
          {added} can now sign in at /admin/login.
        </Alert>
      )}
      {error && <Alert severity="error">{error}</Alert>}
      <Box sx={styles.list}>
        {!admins
          ? [0, 1].map((i) => <Skeleton key={i} variant="rounded" height={72} />)
          : admins.map((admin) => (
              <Box key={admin.id} sx={styles.row}>
                <Avatar sx={styles.avatar}>{admin.name.charAt(0).toUpperCase()}</Avatar>
                <Box sx={styles.text}>
                  <Typography sx={styles.name}>
                    {admin.name} {admin.id === me?.id && <Chip label="You" size="small" sx={styles.you} />}
                  </Typography>
                  <Typography sx={styles.meta}>{admin.email}</Typography>
                </Box>
                <Box sx={styles.dates}>
                  <Typography sx={styles.meta}>Added {when(admin.createdAt)}</Typography>
                  <Typography sx={styles.meta}>Last sign-in {when(admin.lastLoginAt)}</Typography>
                </Box>
              </Box>
            ))}
      </Box>
      {token && (
        <AddAdminDialog
          open={adding}
          token={token}
          onClose={() => setAdding(false)}
          onAdded={(admin) => {
            setAdmins((list) => [...(list ?? []), admin]);
            setAdding(false);
            setAdded(admin.name);
          }}
        />
      )}
    </>
  );
}
