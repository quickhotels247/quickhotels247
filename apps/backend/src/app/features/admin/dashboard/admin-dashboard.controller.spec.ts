import { BadRequestException } from "@nestjs/common";
import { describe, expect, it, vi } from "vitest";
import { AdminDashboardController } from "./admin-dashboard.controller.js";
import type { AdminDashboardRepository } from "./admin-dashboard.repository.js";

describe("AdminDashboardController", () => {
  const setup = () => {
    const repository = { dashboard: vi.fn(async (from: string, to: string) => ({ range: { from, to } })) };
    return { repository, controller: new AdminDashboardController(repository as unknown as AdminDashboardRepository) };
  };

  it("defaults to the last 30 India days", async () => {
    const { controller, repository } = setup();
    await controller.get({});
    const [from, to] = repository.dashboard.mock.calls[0]!;
    expect((new Date(`${to}T00:00:00Z`).getTime() - new Date(`${from}T00:00:00Z`).getTime()) / 86_400_000).toBe(29);
  });

  it("passes chosen dates through and rejects bad ranges", async () => {
    const { controller, repository } = setup();
    await controller.get({ from: "2026-11-01", to: "2026-11-27" });
    expect(repository.dashboard).toHaveBeenCalledWith("2026-11-01", "2026-11-27");
    expect(() => controller.get({ from: "2026-11-28", to: "2026-11-27" })).toThrow(BadRequestException);
    expect(() => controller.get({ from: "2026-02-30", to: "2026-03-01" })).toThrow(BadRequestException);
    expect(() => controller.get({ from: "2024-01-01", to: "2026-11-27" })).toThrow(/at most 366 days/);
  });
});
