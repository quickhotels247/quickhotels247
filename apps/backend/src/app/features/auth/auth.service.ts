import { randomInt, randomUUID } from "node:crypto";
import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import type {
  AuthResponse,
  SendSignupOtpResponse,
  User,
  VerifySignupOtpResponse,
} from "@quickhotels/types/users";
import { MailService } from "../../mail/mail.service.js";
import { welcomeEmail } from "../../mail/templates/welcome.template.js";
import { toPublicUser } from "./dto/auth-response.dto.js";
import type { LoginDto } from "./dto/login.dto.js";
import type { SignupDetailsDto } from "./dto/signup-details.dto.js";
import type { VerifyOtpDto } from "./dto/verify-otp.dto.js";
import type { SignupDto } from "./dto/signup.dto.js";
import { hashPassword, verifyPassword } from "./password-hash.js";
import { checkPasswordPolicy } from "./password-policy.js";
import { ClerkService } from "./clerk.service.js";
import { IdentitiesRepository, accountKey } from "./identities.repository.js";
import { OtpService } from "./otp.service.js";
import { SessionService } from "./session.service.js";
import { UsersRepository, type UserWithPassword } from "./users.repository.js";

// Same message for unknown user and wrong password, so it can't reveal which accounts exist.
const INVALID_CREDENTIALS = "Incorrect username or password.";
const EMAIL_TAKEN = "An account with this email already exists.";
const USERNAME_TAKEN = "This username is taken.";
const UNIQUE_VIOLATION = "23505";

@Injectable()
export class AuthService {
  // Compared against when the user doesn't exist, so both paths take the same time.
  private readonly dummyHash = hashPassword(randomUUID());

  constructor(
    private readonly users: UsersRepository,
    private readonly sessions: SessionService,
    private readonly otp: OtpService,
    private readonly clerk: ClerkService,
    private readonly identities: IdentitiesRepository,
    private readonly mail: MailService,
  ) {}

  // Email/password and Google: trade a Clerk session token for a QuickHotels24/7 session.
  //  1. The Google account is already connected to a user: sign them in.
  //  2. A user has the same verified email: connect the account to them.
  //  3. Otherwise create a new, verified user.
  async loginWithClerk(token: string, device: string | null = null): Promise<AuthResponse> {
    const profile = await this.clerk.profile(token);
    const linked = await this.users.findByClerkId(profile.clerkUserId);
    if (linked) {
      await this.identities.connect(linked.id, profile.clerkUserId, profile.accounts);
      return this.startSession(linked, device);
    }

    const owners = await this.identities.owners(profile.accounts);
    const ownerId = profile.accounts
      .map((account) => owners.get(accountKey(account)))
      .find(Boolean);
    if (ownerId) {
      const user = await this.users.findById(ownerId);
      if (user) {
        await this.users.linkClerk(user.id, profile.clerkUserId);
        await this.identities.connect(
          user.id,
          profile.clerkUserId,
          profile.accounts,
        );
        return this.startSession(user, device);
      }
    }

    // Matching on email is only safe when the provider confirmed the person owns it.
    if (!profile.email || !profile.emailVerified) {
      throw new BadRequestException(
        "That account doesn't have a verified email address. Please verify your email and try again.",
      );
    }

    const existing = await this.users.findByEmail(profile.email);
    if (existing) {
      await this.users.linkClerk(existing.id, profile.clerkUserId);
      await this.identities.connect(
        existing.id,
        profile.clerkUserId,
        profile.accounts,
      );
      return this.startSession(await this.users.markVerified(existing.id), device);
    }

    const email = profile.email;
    try {
      const user = await this.users.create({
        firstName: profile.firstName || email.split("@")[0],
        lastName: profile.lastName ?? "",
        email,
        username: await this.availableUsername(profile.username, email),
        passwordHash: null,
        clerkUserId: profile.clerkUserId,
        isVerified: true,
        signedInWith:
          profile.accounts[0]?.provider === "google" ? "Google" : "QuickHotels",
      });
      await this.identities.connect(
        user.id,
        profile.clerkUserId,
        profile.accounts,
      );
      // A new account: say hello (in the background, never blocking sign-in).
      this.mail.sendInBackground(welcomeEmail(user.email, user.firstName), { template: "welcome", userId: user.id });
      return this.startSession(user, device);
    } catch (error) {
      // Same person finishing sign-in twice at once: use the account that won.
      if ((error as { code?: string }).code === UNIQUE_VIOLATION) {
        const winner = await this.users.findByEmail(email);
        if (winner && winner.clerkUserId === profile.clerkUserId) return this.startSession(winner, device);
      }
      throw error;
    }
  }

  // Sign-up step 1: check the details are available, then email a code.
  async checkSignupDetails(dto: SignupDetailsDto): Promise<void> {
    await this.assertAvailable(dto.email.toLowerCase(), dto.username.toLowerCase());
  }

  async sendSignupOtp(dto: SignupDetailsDto): Promise<SendSignupOtpResponse> {
    const email = dto.email.toLowerCase();
    await this.assertAvailable(email, dto.username.toLowerCase());
    return this.otp.send(email, dto.firstName);
  }

  // Sign-up step 2: confirm the code.
  verifySignupOtp(dto: VerifyOtpDto): Promise<VerifySignupOtpResponse> {
    return this.otp.verify(dto.email.toLowerCase(), dto.code);
  }

  // Sign-up step 3: create the account for a verified email.
  async signup(dto: SignupDto): Promise<AuthResponse> {
    const policyError = checkPasswordPolicy(dto.password);
    if (policyError) throw new BadRequestException(policyError);

    const email = dto.email.toLowerCase();
    const username = dto.username.toLowerCase();
    await this.otp.assertVerified(email, dto.verificationToken);
    await this.assertAvailable(email, username);

    try {
      const user = await this.users.create({
        firstName: dto.firstName,
        lastName: dto.lastName,
        email,
        username,
        passwordHash: await hashPassword(dto.password),
        isVerified: true,
      });
      await this.otp.complete(email);
      return this.startSession(user);
    } catch (error) {
      // Two sign-ups racing for the same email or username: the unique index decides.
      if ((error as { code?: string }).code === UNIQUE_VIOLATION) {
        const constraint = (error as { constraint?: string }).constraint;
        throw new ConflictException(
          constraint === "users_email_key" ? EMAIL_TAKEN : USERNAME_TAKEN,
        );
      }
      throw error;
    }
  }

  async login(dto: LoginDto): Promise<AuthResponse> {
    const user = await this.users.findByIdentifier(dto.identifier);
    const valid = await verifyPassword(
      dto.password,
      user?.passwordHash ?? (await this.dummyHash),
    );
    if (user && !user.passwordHash) {
      throw new UnauthorizedException(
        user.clerkUserId
          ? "Sign in with your email and Clerk password, or continue with Google."
          : "This account signs in with Google. Continue with Google instead, or set a password in Settings after signing in.",
      );
    }
    if (!user || !valid) throw new UnauthorizedException(INVALID_CREDENTIALS);
    return this.startSession(user);
  }

  async me(token: string): Promise<User> {
    const userId = await this.sessions.resolve(token);
    const user = userId ? await this.users.findById(userId) : null;
    if (!user) throw new UnauthorizedException("Your session has expired.");
    return toPublicUser(user);
  }

  async logout(token: string): Promise<void> {
    const userId = await this.sessions.resolve(token);
    await this.sessions.revoke(token);
    // Still signed in on another device? Then the user stays logged in.
    if (userId && !(await this.sessions.hasActiveSession(userId))) {
      await this.users.setLoggedIn(userId, false);
    }
  }

  // Uses the provider's username or the email's local part, made unique if needed.
  private async availableUsername(
    username: string | null,
    email: string,
  ): Promise<string> {
    if (username && /^[a-zA-Z0-9_.-]{3,20}$/.test(username)) {
      const preferred = username.toLowerCase();
      if (!(await this.users.usernameTaken(preferred))) return preferred;
    }
    const base = (username ?? email.split("@")[0])
      .toLowerCase()
      .replace(/[^a-z0-9_.-]/g, "")
      .slice(0, 15)
      .padEnd(3, "0");
    if (!(await this.users.usernameTaken(base))) return base;
    for (let attempt = 0; attempt < 10; attempt++) {
      const candidate = `${base}${randomInt(1000, 10000)}`;
      if (!(await this.users.usernameTaken(candidate))) return candidate;
    }
    return `user${randomInt(10_000_000, 100_000_000)}`;
  }

  private async assertAvailable(email: string, username: string) {
    const conflict = await this.users.findConflict(email, username);
    if (conflict.emailTaken) {
      const owner = await this.users.findByEmail(email);
      throw new ConflictException(
        owner && !owner.passwordHash
          ? owner.clerkUserId
            ? "An account with this email already exists. Use the standard sign-in form to continue."
            : "An account with this email already exists and signs in with Google. Continue with Google instead."
          : EMAIL_TAKEN,
      );
    }
    if (conflict.usernameTaken) throw new ConflictException(USERNAME_TAKEN);
  }

  private async startSession(user: UserWithPassword, device: string | null = null): Promise<AuthResponse> {
    await this.users.setLoggedIn(user.id, true);
    const { token, expiresAt } = await this.sessions.create(user.id, device);
    return {
      user: toPublicUser({ ...user, isLoggedIn: true }),
      token,
      expiresAt: expiresAt.toISOString(),
    };
  }
}
