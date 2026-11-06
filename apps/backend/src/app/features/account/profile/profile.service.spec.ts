import { BadRequestException } from "@nestjs/common";
import { describe, expect, it, vi } from "vitest";
import type { UsersRepository } from "../../auth/users.repository.js";
import { ProfileService } from "./profile.service.js";

const base = { firstName: "Asha", lastName: "Rao" };

function setup() {
  const users = {
    findById: vi.fn(async () => ({ id: "u1" })),
    updateProfile: vi.fn(async (_id: string, changes: object) => ({ id: "u1", passwordHash: null, clerkUserId: null, ...changes })),
  };
  return { service: new ProfileService(users as unknown as UsersRepository), users };
}

describe("ProfileService.update", () => {
  it("joins the phone and clears empty details", async () => {
    const { service, users } = setup();
    const user = await service.update("u1", { ...base, phoneCode: "+91", phone: "9876543210" });
    expect(users.updateProfile).toHaveBeenCalledWith("u1", expect.objectContaining({ phone: "+91 9876543210", dateOfBirth: null, address: null }));
    expect(user).not.toHaveProperty("passwordHash");
  });

  it("needs both phone parts", async () => {
    const { service } = setup();
    await expect(service.update("u1", { ...base, phoneCode: "+91", phone: "" })).rejects.toBeInstanceOf(BadRequestException);
  });

  it("rejects impossible dates and under-18s", async () => {
    const { service } = setup();
    await expect(service.update("u1", { ...base, dateOfBirth: "1990-02-30" })).rejects.toThrow(/date of birth/);
    const young = `${new Date().getUTCFullYear() - 10}-01-01`;
    await expect(service.update("u1", { ...base, dateOfBirth: young })).rejects.toThrow(/at least 18/);
    await expect(service.update("u1", { ...base, dateOfBirth: "1990-05-21" })).resolves.toBeDefined();
  });
});
