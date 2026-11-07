import { describe, expect, it, vi } from "vitest";
import type { MailService } from "../../mail/mail.service.js";
import { AuthService } from "./auth.service.js";
import type { ClerkProfile, ClerkService } from "./clerk.service.js";
import type { UsersRepository, UserWithPassword } from "./users.repository.js";
import type { SessionService } from "./session.service.js";
import type { OtpService } from "./otp.service.js";
import type { IdentitiesRepository } from "./identities.repository.js";

function setup(overrides: Partial<ClerkProfile> = {}) {
  const profile: ClerkProfile = { clerkUserId: "clerk-new", email: "new@example.com",
    emailVerified: true, firstName: "New", lastName: "User", username: "new.user",
    accounts: [], ...overrides };
  const user: UserWithPassword = { id: "quickhotels-new", email: "new@example.com",
    firstName: "New", lastName: "User", username: "new.user", phone: null, dateOfBirth: null, nationality: null, gender: null, address: null, passwordHash: null,
    clerkUserId: "clerk-new", isVerified: true, isLoggedIn: false,
    signedInWith: "QuickHotels", workspace: null, createdAt: new Date().toISOString() };
  const users = { findByClerkId: vi.fn(async (): Promise<UserWithPassword | null> => null),
    findByEmail: vi.fn(async (): Promise<UserWithPassword | null> => null),
    findById: vi.fn(async () => user), usernameTaken: vi.fn(async () => false),
    create: vi.fn(async (_input: unknown) => user), setLoggedIn: vi.fn(),
    linkClerk: vi.fn(), markVerified: vi.fn(async () => user) };
  const identities = { owners: vi.fn(async () => new Map()), connect: vi.fn() };
  const sessions = { create: vi.fn(async () => ({ token: "quickhotels-session", expiresAt: new Date() })) };
  const clerk = { profile: vi.fn(async () => profile) };
  const mail = { sendInBackground: vi.fn() };
  const service = new AuthService(users as unknown as UsersRepository,
    sessions as unknown as SessionService, {} as OtpService,
    clerk as unknown as ClerkService, identities as unknown as IdentitiesRepository,
    mail as unknown as MailService);
  return { service, users, identities, user, mail };
}

describe("Clerk email registration and login", () => {
  it("creates a verified email-only account without a local password or SMTP", async () => {
    const { service, users, mail } = setup();
    const response = await service.loginWithClerk("verified-session");
    expect(mail.sendInBackground).toHaveBeenCalledWith(expect.objectContaining({ to: "new@example.com" }), expect.objectContaining({ template: "welcome" }));
    expect(users.create).toHaveBeenCalledWith(expect.objectContaining({
      clerkUserId: "clerk-new", username: "new.user", passwordHash: null,
      isVerified: true, signedInWith: "QuickHotels",
    }));
    expect(response.token).toBe("quickhotels-session");
    expect(response.user).not.toHaveProperty("passwordHash");
    expect(response.user).not.toHaveProperty("clerkUserId");
  });

  it("rejects unverified email-only accounts", async () => {
    const { service, users } = setup({ emailVerified: false });
    await expect(service.loginWithClerk("session")).rejects.toThrow(/verified email/);
    expect(users.create).not.toHaveBeenCalled();
  });

  it("uses the stable Clerk ID when the email changes", async () => {
    const { service, users, user } = setup({ email: "changed@example.com" });
    users.findByClerkId.mockResolvedValue(user);
    await service.loginWithClerk("session");
    expect(users.findByEmail).not.toHaveBeenCalled();
    expect(users.create).not.toHaveBeenCalled();
  });

  it("links an existing verified-email match without replacing its password", async () => {
    const { service, users, user } = setup();
    users.findByEmail.mockResolvedValue({ ...user, passwordHash: "existing-hash", clerkUserId: null });
    await service.loginWithClerk("session");
    expect(users.linkClerk).toHaveBeenCalledWith(user.id, "clerk-new");
    expect(users.create).not.toHaveBeenCalled();
  });

  it("does not issue a session to a different Clerk user after a uniqueness conflict", async () => {
    const { service, users, user } = setup();
    users.create.mockRejectedValueOnce({ code: "23505" });
    users.findByEmail.mockResolvedValueOnce(null).mockResolvedValueOnce({ ...user, clerkUserId: "other-clerk" });
    await expect(service.loginWithClerk("session")).rejects.toMatchObject({ code: "23505" });
  });

  it("preserves the existing Google identity matching path", async () => {
    const { service, users, identities, user } = setup({ accounts: [
      { provider: "google", providerUserId: "google-id", email: "new@example.com" },
    ] });
    identities.owners.mockResolvedValue(new Map([["google:google-id", user.id]]));
    await service.loginWithClerk("session");
    expect(users.findById).toHaveBeenCalledWith(user.id);
    expect(users.linkClerk).toHaveBeenCalledWith(user.id, "clerk-new");
    expect(users.create).not.toHaveBeenCalled();
  });
});
