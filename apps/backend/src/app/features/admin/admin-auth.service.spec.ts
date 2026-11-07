import { ForbiddenException, UnauthorizedException, type ExecutionContext } from "@nestjs/common";
import type { Reflector } from "@nestjs/core";
import type { AdminPermission, AdminRole } from "@quickhotels/types/admin";
import { permissionsOf } from "./admin-permissions.js";
import { describe, expect, it, vi } from "vitest";
import { hashPassword } from "../auth/password-hash.js";
import { hashToken } from "../auth/session.service.js";
import { AdminAuthService } from "./admin-auth.service.js";
import { AdminGuard } from "./admin.guard.js";
import type { AdminConfig } from "./admin.config.js";
import type { AdminsRepository } from "./admins.repository.js";
import type { AuditLogRepository } from "./audit-log.repository.js";

async function setup(config: Partial<AdminConfig> = {}) {
  const admin = {
    id: "a1", name: "Admin", email: "admin@quickhotels247.com", role: "SUPER_ADMIN" as const, permissions: permissionsOf("SUPER_ADMIN"),
    passwordHash: await hashPassword("correct-horse-battery"),
  };
  // Role per admin id, as resolveToken reads it.
  const roles = new Map<string, AdminRole>([["a1", "SUPER_ADMIN"]]);
  const tokens = new Map<string, string>();
  const admins = {
    findByEmail: vi.fn(async (email: string) =>
      email.toLowerCase() === admin.email ? admin : null),
    findById: vi.fn(async () => admin),
    markLoggedIn: vi.fn(),
    createToken: vi.fn(async (id: string, hash: string) => void tokens.set(hash, id)),
    resolveToken: vi.fn(async (hash: string) => {
      const adminId = tokens.get(hash);
      return adminId ? { adminId, role: roles.get(adminId) ?? "SUPER_ADMIN" } : null;
    }),
    revokeToken: vi.fn(async (hash: string) => void tokens.delete(hash)),
    exists: vi.fn(async () => true),
    createFirst: vi.fn(async (data: { name: string; email: string }) => ({ id: "a2", ...data })),
    passwordHash: vi.fn(async () => admin.passwordHash),
    setPassword: vi.fn(),
  };
  const audit = { record: vi.fn() };
  const service = new AdminAuthService(
    admins as unknown as AdminsRepository,
    audit as unknown as AuditLogRepository,
    { sessionTtlMs: 3_600_000, maxLoginAttempts: 3, loginLockMs: 60_000, production: false, ...config } as AdminConfig,
  );
  // The route's required permission, as @RequirePermission would set it.
  const required: { permission?: AdminPermission } = {};
  const reflector = { getAllAndOverride: () => required.permission } as unknown as Reflector;
  const guard = new AdminGuard(admins as unknown as AdminsRepository, reflector);
  return { service, guard, admins, audit, roles, required };
}

const contextFor = (authorization?: string) => {
  const request = { headers: { authorization } } as Record<string, unknown>;
  return {
    request,
    context: { switchToHttp: () => ({ getRequest: () => request }), getHandler: () => undefined, getClass: () => undefined } as unknown as ExecutionContext,
  };
};

describe("admin sign-in", () => {
  it("issues a token that only the hash of is stored, and audits the sign-in", async () => {
    const { service, admins, audit } = await setup();
    const result = await service.login({ email: "Admin@QuickHotels247.com", password: "correct-horse-battery" }, "1.2.3.4");
    expect(result.admin).toEqual({ id: "a1", name: "Admin", email: "admin@quickhotels247.com", role: "SUPER_ADMIN", permissions: permissionsOf("SUPER_ADMIN") });
    expect(admins.createToken).toHaveBeenCalledWith("a1", hashToken(result.token), expect.any(Date));
    expect(audit.record).toHaveBeenCalledWith("a1", "admin.login", null, { ip: "1.2.3.4" });
  });

  it("gives the same answer for an unknown email and a wrong password", async () => {
    const { service } = await setup();
    await expect(
      service.login({ email: "x@y.z", password: "whatever" }, "ip"),
    ).rejects.toThrow("Email or password is incorrect.");
    await expect(
      service.login({ email: "admin@quickhotels247.com", password: "wrong" }, "ip"),
    ).rejects.toThrow("Email or password is incorrect.");
  });

  it("pauses an email + address after too many failures, even with the right password", async () => {
    const { service } = await setup();
    for (let i = 0; i < 3; i++) {
      await expect(service.login({ email: "admin@quickhotels247.com", password: "nope" }, "ip")).rejects.toBeInstanceOf(UnauthorizedException);
    }
    await expect(
      service.login({ email: "admin@quickhotels247.com", password: "correct-horse-battery" }, "ip"),
    ).rejects.toThrow(/Too many/);
    // Another address isn't locked out.
    await expect(
      service.login({ email: "admin@quickhotels247.com", password: "correct-horse-battery" }, "other-ip"),
    ).resolves.toBeDefined();
  });
});

describe("admin guard", () => {
  it("lets a live admin token through and rejects anything else", async () => {
    const { service, guard } = await setup();
    const { token } = await service.login({ email: "admin@quickhotels247.com", password: "correct-horse-battery" }, "ip");

    const ok = contextFor(`Bearer ${token}`);
    await expect(guard.canActivate(ok.context)).resolves.toBe(true);
    expect(ok.request.adminId).toBe("a1");

    await expect(guard.canActivate(contextFor("Bearer user-token").context)).rejects.toBeInstanceOf(UnauthorizedException);
    await expect(guard.canActivate(contextFor().context)).rejects.toBeInstanceOf(UnauthorizedException);

    await service.logout(token);
    await expect(guard.canActivate(contextFor(`Bearer ${token}`).context)).rejects.toBeInstanceOf(UnauthorizedException);
  });
});

describe("admin signup and password", () => {
  it("opens signup only while no admin exists", async () => {
    const { service, admins } = await setup();
    expect(await service.setupStatus()).toMatchObject({ setupNeeded: false });
    admins.exists.mockResolvedValueOnce(false);
    expect(await service.setupStatus()).toMatchObject({ setupNeeded: true });
  });

  it("creates the first admin with a hashed password and signs them in", async () => {
    const { service, admins, audit } = await setup();
    const result = await service.setup(
      { name: "First", email: "first@quickhotels247.com", password: "a-long-password-1" }, "ip");
    expect(result.admin).toMatchObject({ id: "a2", email: "first@quickhotels247.com" });
    expect(result.token).toBeTruthy();
    const saved = admins.createFirst.mock.calls[0]![0] as unknown as { passwordHash: string };
    expect(saved.passwordHash).toMatch(/^scrypt\$/);
    expect(audit.record).toHaveBeenCalledWith("a2", "admin.setup", null, { ip: "ip" });
  });

  it("refuses signup once an admin exists, and weak passwords", async () => {
    const { service, admins } = await setup();
    admins.createFirst.mockResolvedValueOnce(null as never);
    await expect(service.setup(
      { name: "Late", email: "late@quickhotels247.com", password: "a-long-password-1" }, "ip"),
    ).rejects.toThrow(/already exists/);
    await expect(service.setup(
      { name: "Weak", email: "weak@quickhotels247.com", password: "short1" }, "ip"),
    ).rejects.toThrow(/at least 12/);
    await expect(service.setup(
      { name: "Weak", email: "weak@quickhotels247.com", password: "no-digits-at-all" }, "ip"),
    ).rejects.toThrow(/letter and a number/);
  });

  it("changes the password only with the current one, keeping this session", async () => {
    const { service, admins } = await setup();
    await expect(service.changePassword("a1", "tok", {
      currentPassword: "wrong", newPassword: "another-password-2" }),
    ).rejects.toThrow(/current password/);
    await expect(service.changePassword("a1", "tok", {
      currentPassword: "correct-horse-battery", newPassword: "short1" }),
    ).rejects.toThrow(/at least 12/);
    await service.changePassword("a1", "tok", {
      currentPassword: "correct-horse-battery", newPassword: "another-password-2" });
    expect(admins.setPassword).toHaveBeenCalledWith("a1", expect.stringMatching(/^scrypt\$/), hashToken("tok"));
  });
});

describe("admin setup token (production)", () => {
  const first = { name: "First", email: "first@quickhotels247.com", password: "a-long-password-1" };

  it("keeps sign-up closed in production without ADMIN_SETUP_TOKEN", async () => {
    const { service, admins } = await setup({ production: true });
    admins.exists.mockResolvedValue(false);
    expect(await service.setupStatus()).toEqual({ setupNeeded: false, tokenRequired: false });
    await expect(service.setup(first, "ip")).rejects.toThrow(/turned off/);
    expect(admins.createFirst).not.toHaveBeenCalled();
  });

  it("needs the right token when one is set", async () => {
    const { service, admins } = await setup({ production: true, setupToken: "s3cret-token" });
    admins.exists.mockResolvedValue(false);
    expect(await service.setupStatus()).toEqual({ setupNeeded: true, tokenRequired: true });
    await expect(service.setup({ ...first, setupToken: "wrong" }, "ip")).rejects.toThrow(/isn't right/);
    await expect(service.setup(first, "ip")).rejects.toThrow(/isn't right/);
    await expect(service.setup({ ...first, setupToken: "s3cret-token" }, "ip")).resolves.toBeDefined();
  });
});

describe("admin roles", () => {
  it("lets a route through only with the role's permission", async () => {
    const { service, guard, roles, required } = await setup();
    const { token } = await service.login({ email: "admin@quickhotels247.com", password: "correct-horse-battery" }, "ip");
    required.permission = "pricing";
    await expect(guard.canActivate(contextFor(`Bearer ${token}`).context)).resolves.toBe(true);
    roles.set("a1", "SUPPORT_AGENT");
    await expect(guard.canActivate(contextFor(`Bearer ${token}`).context)).rejects.toBeInstanceOf(ForbiddenException);
    required.permission = "support";
    await expect(guard.canActivate(contextFor(`Bearer ${token}`).context)).resolves.toBe(true);
  });
});
