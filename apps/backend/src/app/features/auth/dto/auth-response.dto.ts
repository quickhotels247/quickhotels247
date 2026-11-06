import type { User } from "@quickhotels/types/users";
import type { UserWithPassword } from "../users.repository.js";

export function toPublicUser({
  passwordHash: _,
  clerkUserId: _clerkUserId,
  ...user
}: UserWithPassword): User {
  return user;
}
