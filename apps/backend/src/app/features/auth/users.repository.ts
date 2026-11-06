import { ConflictException, Injectable } from "@nestjs/common";
import type { Gender, NotificationPreferences, PostalAddress, SignedInWith, User } from "@quickhotels/types/users";
import { PrismaService } from "../../common/database/prisma.service.js";
import { Prisma, type User as UserRecord } from "../../../generated/prisma/client.js";

export interface UserWithPassword extends User {
  // Null for people who only sign in with Google.
  passwordHash: string | null;
  clerkUserId: string | null;
}

export interface NewUser {
  firstName: string;
  lastName: string;
  email: string;
  username: string;
  passwordHash: string | null;
  isVerified: boolean;
  signedInWith?: SignedInWith;
  clerkUserId?: string;
}

export interface ProfileChanges {
  firstName: string;
  lastName: string;
  phone: string | null;
  dateOfBirth: string | null;
  nationality: string | null;
  gender: Gender | null;
  address: PostalAddress | null;
}

function toUser(row: UserRecord): UserWithPassword {
  return {
    id: row.id,
    firstName: row.firstName,
    lastName: row.lastName,
    email: row.email,
    username: row.username,
    phone: row.phone,
    dateOfBirth: row.dateOfBirth ? row.dateOfBirth.toISOString().slice(0, 10) : null,
    nationality: row.nationality,
    gender: row.gender as Gender | null,
    address: (row.address as PostalAddress | null) ?? null,
    passwordHash: row.passwordHash,
    clerkUserId: row.clerkUserId,
    isVerified: row.isVerified,
    isLoggedIn: row.isLoggedIn,
    signedInWith: row.signedInWith as SignedInWith,
    workspace: row.workspace,
    createdAt: row.createdAt.toISOString(),
  };
}

@Injectable()
export class UsersRepository {
  constructor(private readonly db: PrismaService) {}

  // Email and username compare ignoring case, matching the lower() unique
  // indexes. (Prisma's case-insensitive mode would treat % and _ as wildcards.)
  private async findOneWhereLower(by: "email" | "identifier", value: string) {
    const rows =
      by === "email"
        ? await this.db.$queryRaw<{ id: string }[]>`SELECT id FROM users WHERE lower(email) = lower(${value}) LIMIT 1`
        : await this.db.$queryRaw<{ id: string }[]>`
            SELECT id FROM users WHERE lower(email) = lower(${value}) OR lower(username) = lower(${value}) LIMIT 1`;
    return rows[0] ? this.findById(rows[0].id) : null;
  }

  async findByClerkId(clerkUserId: string): Promise<UserWithPassword | null> {
    const row = await this.db.user.findUnique({ where: { clerkUserId } });
    return row ? toUser(row) : null;
  }

  async linkClerk(userId: string, clerkUserId: string): Promise<void> {
    const { count } = await this.db.user.updateMany({
      where: { id: userId, OR: [{ clerkUserId: null }, { clerkUserId }] },
      data: { clerkUserId },
    });
    if (!count) throw new ConflictException("This account is linked to another Clerk user. Please use your original sign-in method.");
  }

  async updateProfile(id: string, changes: ProfileChanges): Promise<UserWithPassword> {
    const { address, dateOfBirth, ...rest } = changes;
    return toUser(
      await this.db.user.update({
        where: { id },
        data: {
          ...rest,
          dateOfBirth: dateOfBirth ? new Date(`${dateOfBirth}T00:00:00Z`) : null,
          address: address ? { ...address } : Prisma.DbNull,
        },
      }),
    );
  }

  async preferences(id: string): Promise<NotificationPreferences | null> {
    const row = await this.db.user.findUnique({ where: { id }, select: { notifyDeals: true, notifyTripReminders: true, notifyReviews: true } });
    return row ? { dealsEmails: row.notifyDeals, tripReminders: row.notifyTripReminders, reviewRequests: row.notifyReviews } : null;
  }

  async setPreferences(id: string, preferences: NotificationPreferences): Promise<NotificationPreferences> {
    await this.db.user.update({
      where: { id },
      data: {
        notifyDeals: preferences.dealsEmails,
        notifyTripReminders: preferences.tripReminders,
        notifyReviews: preferences.reviewRequests,
        preferencesUpdatedAt: new Date(),
      },
    });
    return preferences;
  }

  async findById(id: string): Promise<UserWithPassword | null> {
    const row = await this.db.user.findUnique({ where: { id } });
    return row ? toUser(row) : null;
  }

  // Matches either the email or the username, ignoring case.
  findByIdentifier(identifier: string): Promise<UserWithPassword | null> {
    return this.findOneWhereLower("identifier", identifier);
  }

  findByEmail(email: string): Promise<UserWithPassword | null> {
    return this.findOneWhereLower("email", email);
  }

  async usernameTaken(username: string): Promise<boolean> {
    const rows = await this.db.$queryRaw<unknown[]>`SELECT 1 FROM users WHERE lower(username) = lower(${username}) LIMIT 1`;
    return rows.length > 0;
  }

  async findConflict(email: string, username: string) {
    const rows = await this.db.$queryRaw<{ email_taken: boolean | null; username_taken: boolean | null }[]>`
      SELECT
        bool_or(lower(email) = lower(${email})) AS email_taken,
        bool_or(lower(username) = lower(${username})) AS username_taken
      FROM users
      WHERE lower(email) = lower(${email}) OR lower(username) = lower(${username})`;
    return {
      emailTaken: Boolean(rows[0]?.email_taken),
      usernameTaken: Boolean(rows[0]?.username_taken),
    };
  }

  async create(user: NewUser): Promise<UserWithPassword> {
    const row = await this.db.user.create({
      data: {
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        username: user.username,
        passwordHash: user.passwordHash,
        isVerified: user.isVerified,
        signedInWith: user.signedInWith ?? "QuickHotels",
        clerkUserId: user.clerkUserId ?? null,
      },
    });
    return toUser(row);
  }

  // The person proved they own the email (OTP or a verified Google email).
  async markVerified(id: string): Promise<UserWithPassword> {
    return toUser(await this.db.user.update({ where: { id }, data: { isVerified: true } }));
  }

  async setPassword(id: string, passwordHash: string): Promise<void> {
    await this.db.user.update({ where: { id }, data: { passwordHash } });
  }

  async setLoggedIn(id: string, loggedIn: boolean): Promise<void> {
    await this.db.user.update({ where: { id }, data: { isLoggedIn: loggedIn } });
  }
}
