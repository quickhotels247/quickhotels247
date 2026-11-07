import { afterEach, describe, expect, it, vi } from "vitest";
import type { MailService } from "../../mail/mail.service.js";
import type { SupportRepository } from "./support.repository.js";
import { SupportService } from "./support.service.js";

const dto = { name: "Asha", email: "asha@example.com", phone: null, topic: "booking" as const, bookingReference: "QH-7K2M9P", message: "Can I add breakfast to my stay?" };

function setup(bookingId: string | null = "booking-1") {
  const tickets = { findBookingFor: vi.fn(async () => bookingId), create: vi.fn(async () => "T-123456") };
  const mail = { sendInBackground: vi.fn() };
  return { service: new SupportService(tickets as unknown as SupportRepository, mail as unknown as MailService), tickets, mail };
}

describe("SupportService.create", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("saves the ticket, links the customer's booking and sends both emails", async () => {
    vi.stubEnv("MAIL_FROM", "QuickHotels24/7 <team@example.com>");
    const { service, tickets, mail } = setup();
    expect(await service.create(dto, "user-1")).toEqual({ reference: "T-123456" });
    expect(tickets.findBookingFor).toHaveBeenCalledWith("QH-7K2M9P", "asha@example.com", "user-1");
    expect(tickets.create).toHaveBeenCalledWith(dto, "user-1", "booking-1");
    const sent = mail.sendInBackground.mock.calls.map(([message]) => message.to);
    expect(sent).toEqual(["asha@example.com", "team@example.com"]);
  });

  it("works for guests without a booking reference", async () => {
    const { service, tickets } = setup(null);
    await service.create({ ...dto, bookingReference: null }, null);
    expect(tickets.findBookingFor).not.toHaveBeenCalled();
    expect(tickets.create).toHaveBeenCalledWith(expect.anything(), null, null);
  });
});
