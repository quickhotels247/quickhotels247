import { BadRequestException, ConflictException } from "@nestjs/common";
import { describe, expect, it, vi } from "vitest";
import type { ClerkService } from "../../auth/clerk.service.js";
import type { SessionService } from "../../auth/session.service.js";
import type { UsersRepository } from "../../auth/users.repository.js";
import type { AccountDeletionRepository } from "./account-deletion.repository.js";
import { SecurityService } from "./security.service.js";

function setup(openBookings = false) {
  const users = { findById: vi.fn(async () => ({ id: "u1", email: "Asha@Example.com", clerkUserId: "clerk_1" })) };
  const clerk = { deleteUser: vi.fn(async () => {}) };
  const deletion = { hasOpenBookings: vi.fn(async () => openBookings), anonymise: vi.fn(async () => {}) };
  const service = new SecurityService(
    {} as SessionService,
    users as unknown as UsersRepository,
    clerk as unknown as ClerkService,
    deletion as unknown as AccountDeletionRepository,
  );
  return { service, clerk, deletion };
}

describe("SecurityService.deleteAccount", () => {
  it("needs the account email typed to confirm", async () => {
    const { service, deletion } = setup();
    await expect(service.deleteAccount("u1", "someone@else.com")).rejects.toBeInstanceOf(BadRequestException);
    expect(deletion.anonymise).not.toHaveBeenCalled();
  });

  it("refuses while a booking is upcoming or in progress", async () => {
    const { service, deletion } = setup(true);
    await expect(service.deleteAccount("u1", "asha@example.com")).rejects.toBeInstanceOf(ConflictException);
    expect(deletion.anonymise).not.toHaveBeenCalled();
  });

  it("closes the account and removes the Clerk user", async () => {
    const { service, deletion, clerk } = setup();
    await service.deleteAccount("u1", " asha@example.com ");
    expect(deletion.anonymise).toHaveBeenCalledWith("u1");
    expect(clerk.deleteUser).toHaveBeenCalledWith("clerk_1");
  });
});
