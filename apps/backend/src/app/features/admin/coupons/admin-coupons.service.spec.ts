import { NotFoundException } from "@nestjs/common";
import { describe, expect, it, vi } from "vitest";
import type { CouponsRepository } from "../../coupons/coupons.repository.js";
import type { AuditLogRepository } from "../audit-log.repository.js";
import { AdminCouponsService } from "./admin-coupons.service.js";

describe("AdminCouponsService report and actions", () => {
  const setup = (exists = true) => {
    const report = { coupon: { code: "GOA500" }, totals: { uses: 0, discountGiven: 0, bookingValue: 0, customers: 0 }, redemptions: [] };
    const coupons = { report: vi.fn(async () => (exists ? report : null)), act: vi.fn(async () => exists) };
    const audit = { record: vi.fn(async () => {}) };
    return { coupons, audit, service: new AdminCouponsService(coupons as unknown as CouponsRepository, audit as unknown as AuditLogRepository) };
  };

  it("pauses a coupon, returns the fresh report and audits it", async () => {
    const { service, coupons, audit } = setup();
    await expect(service.act("c1", "pause", "admin-1")).resolves.toMatchObject({ coupon: { code: "GOA500" } });
    expect(coupons.act).toHaveBeenCalledWith("c1", "pause");
    expect(audit.record).toHaveBeenCalledWith("admin-1", "coupon.pause", "c1", { code: "GOA500" });
  });

  it("says so when the coupon is gone", async () => {
    const { service, audit } = setup(false);
    await expect(service.report("missing")).rejects.toBeInstanceOf(NotFoundException);
    await expect(service.act("missing", "end", "admin-1")).rejects.toBeInstanceOf(NotFoundException);
    expect(audit.record).not.toHaveBeenCalled();
  });
});
