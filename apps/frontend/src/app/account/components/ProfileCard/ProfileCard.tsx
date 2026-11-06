import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Typography from "@mui/material/Typography";
import VerifiedRounded from "@mui/icons-material/VerifiedRounded";
import type { User } from "@quickhotels/types/users";
import { styles } from "./ProfileCard.styles";

// Name, member since, email (verified), username and how they signed up.
// These can't be edited; personal details are in the form below it.
export default function ProfileCard({ user }: { user: User }) {
  const since = new Date(user.createdAt).toLocaleDateString("en-IN", { month: "long", year: "numeric" });
  const rows: [string, React.ReactNode][] = [
    [
      "Email",
      <Box key="email" component="span" sx={styles.email}>
        {user.email}
        {user.isVerified && <Chip icon={<VerifiedRounded />} label="Verified" size="small" color="success" variant="outlined" sx={styles.chip} />}
      </Box>,
    ],
    ["Username", user.username],
    ["Signed up with", user.signedInWith === "Google" ? "Google" : "Email"],
  ];
  return (
    <Box component="section" aria-labelledby="profile-title" sx={styles.root}>
      <Box sx={styles.head}>
        <Avatar sx={styles.avatar}>{user.firstName.charAt(0).toUpperCase()}</Avatar>
        <Box>
          <Typography component="h2" id="profile-title" sx={styles.name}>
            {user.firstName} {user.lastName}
          </Typography>
          <Typography sx={styles.since}>Member since {since}</Typography>
        </Box>
      </Box>
      <Box component="dl" sx={styles.list}>
        {rows.map(([label, value]) => (
          <Box key={label} sx={styles.row}>
            <Typography component="dt" sx={styles.label}>
              {label}
            </Typography>
            <Typography component="dd" sx={styles.value}>
              {value}
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
}
