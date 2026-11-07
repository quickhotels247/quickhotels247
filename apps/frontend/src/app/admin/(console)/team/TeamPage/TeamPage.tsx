"use client";

import { useEffect, useState } from "react";
import Alert from "@mui/material/Alert";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import IconButton from "@mui/material/IconButton";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import Skeleton from "@mui/material/Skeleton";
import Typography from "@mui/material/Typography";
import PersonAddAlt1Outlined from "@mui/icons-material/PersonAddAlt1Outlined";
import PersonRemoveOutlined from "@mui/icons-material/PersonRemoveOutlined";
import type { AdminAccount, AdminRole } from "@quickhotels/types/admin";
import { ROLE_INFO, ROLES } from "@/lib/admin/roles";
import { useRequest } from "@/lib/hooks/useRequest";
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
  const [removing, setRemoving] = useState<AdminAccount | null>(null);
  const change = useRequest();
  useEffect(() => setAdmins(data), [data]);

  const setRole = (admin: AdminAccount, role: AdminRole) => void change.run(async () => setAdmins(await adminApi.setAdminRole(token!, admin.id, role)));
  const confirmRemove = () => {
    const admin = removing;
    if (!admin) return;
    void change.run(async () => {
      setAdmins(await adminApi.removeAdmin(token!, admin.id));
      setRemoving(null);
    });
  };

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
      {change.error && !removing && <Alert severity="error" sx={styles.alert}>{change.error}</Alert>}
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
                <Box sx={styles.controls}>
                  <TextField
                    select
                    size="small"
                    value={admin.role}
                    onChange={(event) => setRole(admin, event.target.value as AdminRole)}
                    disabled={admin.id === me?.id || change.busy}
                    slotProps={{ htmlInput: { "aria-label": `Role of ${admin.name}` } }}
                    sx={styles.role}
                  >
                    {ROLES.map((role) => (
                      <MenuItem key={role} value={role}>
                        {ROLE_INFO[role].label}
                      </MenuItem>
                    ))}
                  </TextField>
                  {admin.id !== me?.id && (
                    <Tooltip title="Remove access">
                      <IconButton aria-label={`Remove ${admin.name}`} onClick={() => setRemoving(admin)} disabled={change.busy}>
                        <PersonRemoveOutlined fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                </Box>
              </Box>
            ))}
      </Box>
      <Box sx={styles.legend}>
        {ROLES.map((role) => (
          <Typography key={role} sx={styles.meta}>
            <b>{ROLE_INFO[role].label}:</b> {ROLE_INFO[role].description}
          </Typography>
        ))}
      </Box>
      <Dialog open={Boolean(removing)} onClose={change.busy ? undefined : () => setRemoving(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Remove {removing?.name}?</DialogTitle>
        <DialogContent>
          {change.error && <Alert severity="error" sx={styles.alert}>{change.error}</Alert>}
          <Typography>They&apos;re signed out at once and can no longer sign in. Their past actions stay in the activity log.</Typography>
        </DialogContent>
        <DialogActions sx={styles.dialogActions}>
          <Button onClick={() => setRemoving(null)} disabled={change.busy}>
            Cancel
          </Button>
          <Button color="error" variant="contained" onClick={confirmRemove} disabled={change.busy}>
            {change.busy ? "Removing…" : "Remove"}
          </Button>
        </DialogActions>
      </Dialog>
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
