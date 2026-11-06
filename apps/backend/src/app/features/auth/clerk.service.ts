import {
  Inject,
  Injectable,
  Logger,
  ServiceUnavailableException,
  UnauthorizedException,
} from "@nestjs/common";
import { createClerkClient, verifyToken } from "@clerk/backend";
import type { IdentityProvider } from "@quickhotels/types/users";
import { authConfig, type AuthConfig } from "./auth.config.js";
import type { ProviderAccount } from "./identities.repository.js";

export interface ClerkProfile {
  clerkUserId: string;
  // Primary email, lowercased; null if the account has none.
  email: string | null;
  // Whether Google confirmed the person owns that email.
  emailVerified: boolean;
  firstName: string | null;
  lastName: string | null;
  username: string | null;
  // The Google accounts attached to this Clerk user.
  accounts: ProviderAccount[];
}

// Clerk reports "oauth_google"; we store "google".
const PROVIDERS: Record<string, IdentityProvider> = {
  oauth_google: "google",
  google: "google",
};

// Confirms a Clerk session token and reads who signed in.
@Injectable()
export class ClerkService {
  private readonly logger = new Logger(ClerkService.name);
  private readonly client: ReturnType<typeof createClerkClient> | null;

  constructor(@Inject(authConfig.KEY) private readonly config: AuthConfig) {
    this.client = config.clerkSecretKey
      ? createClerkClient({ secretKey: config.clerkSecretKey })
      : null;
  }

  async profile(token: string): Promise<ClerkProfile> {
    if (!this.client || !this.config.clerkSecretKey) {
      throw new ServiceUnavailableException(
        "Clerk authentication isn't set up on the server yet.",
      );
    }

    let clerkUserId: string | undefined;
    try {
      // Returns the token's claims and throws if the token is invalid. (Clerk's
      // shared types don't resolve under NodeNext, so the claim is typed here.)
      const claims = (await verifyToken(token, {
        secretKey: this.config.clerkSecretKey,
        authorizedParties: this.config.clerkAuthorizedParties,
      })) as { sub?: string };
      clerkUserId = claims.sub;
    } catch (error) {
      this.logger.warn(`Clerk token rejected: ${(error as Error).message}`);
    }
    if (!clerkUserId) {
      throw new UnauthorizedException(
        "Your sign-in expired. Please try again.",
      );
    }

    const user = await this.client.users.getUser(clerkUserId);
    const primary = user.emailAddresses.find(
      (address) => address.id === user.primaryEmailAddressId,
    );
    const accounts = user.externalAccounts
      .filter(
        (account) =>
          PROVIDERS[account.provider] &&
          account.verification?.status === "verified",
      )
      .map((account) => ({
        provider: PROVIDERS[account.provider],
        providerUserId: account.providerUserId,
        email: account.emailAddress?.toLowerCase() || null,
      }));

    return {
      clerkUserId,
      email: primary?.emailAddress.toLowerCase() ?? null,
      emailVerified: primary?.verification?.status === "verified",
      firstName: user.firstName,
      lastName: user.lastName,
      username: user.username ?? (
        typeof user.unsafeMetadata.quickhotelsUsername === "string" &&
        /^[a-zA-Z0-9_.-]{3,20}$/.test(user.unsafeMetadata.quickhotelsUsername)
          ? user.unsafeMetadata.quickhotelsUsername : null
      ),
      accounts,
    };
  }

  // Removes the person's Clerk account when they delete their QuickHotels24/7
  // account, so the email is free to sign up again. Best effort: a failure is
  // logged (our account is already closed and unlinked from Clerk).
  async deleteUser(clerkUserId: string): Promise<void> {
    if (!this.client) return;
    try {
      await this.client.users.deleteUser(clerkUserId);
    } catch (error) {
      this.logger.warn(`Could not delete Clerk user ${clerkUserId}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}
