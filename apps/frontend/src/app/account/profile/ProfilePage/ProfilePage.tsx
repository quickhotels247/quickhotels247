"use client";

import { useAuth } from "@/lib/auth/useAuth";
import AccountShell from "../../components/AccountShell";
import PersonalDetailsForm from "../../components/PersonalDetailsForm";
import ProfileCard from "../../components/ProfileCard";

export default function ProfilePage() {
  const { user, token, updateUser } = useAuth();
  return (
    <AccountShell title="Personal details" subtitle="Saved details fill checkout forms for you. Only your name is required.">
      {user && token && (
        <>
          <ProfileCard user={user} />
          <PersonalDetailsForm user={user} token={token} onSaved={updateUser} />
        </>
      )}
    </AccountShell>
  );
}
