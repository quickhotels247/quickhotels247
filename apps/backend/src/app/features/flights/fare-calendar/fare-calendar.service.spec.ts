import { describe, expect, it, vi } from "vitest";
import type { FlightSearchCriteria } from "@quickhotels/types/flights";
import type { FlightTrip } from "../../../suppliers/flight-supplier.js";
import type { FareCalendarRepository } from "./fare-calendar.repository.js";
import { FareCalendarService } from "./fare-calendar.service.js";

const fare = (amount: number) => ({ pricePerAdult: { amount, currency: "INR" } });
const trips = (lists: Record<string, number[]>) => Object.entries(lists).map(([key, prices]) => ({ key, label: key, options: prices.map(fare) })) as unknown as FlightTrip[];
const criteria = (changes: Partial<FlightSearchCriteria>) =>
  ({ tripType: "oneWay", from: "HYD", to: "CCU", depart: "2026-12-01", return: "", adults: 2, children: 0, infants: 0, cabin: "economy", legs: [], ...changes }) as FlightSearchCriteria;

function setup() {
  const repo = { save: vi.fn(async () => {}), range: vi.fn(async () => [{ date: "2026-12-01", amount: 4100, currency: "INR" }]) };
  return { repo, service: new FareCalendarService(repo as unknown as FareCalendarRepository) };
}

describe("FareCalendarService", () => {
  it("saves the cheapest fare per adult for a one-way search", () => {
    const { repo, service } = setup();
    service.remember(criteria({}), trips({ ONWARD: [5200, 4100, 4800] }));
    expect(repo.save).toHaveBeenCalledWith([{ from: "HYD", to: "CCU", date: "2026-12-01", cabin: "economy", amount: 4100, currency: "INR" }]);
  });

  it("saves both directions of a domestic return, and nothing for combos or multi-city", () => {
    const { repo, service } = setup();
    service.remember(criteria({ tripType: "roundTrip", return: "2026-12-05" }), trips({ ONWARD: [4000], RETURN: [3900] }));
    expect(repo.save).toHaveBeenCalledWith([
      expect.objectContaining({ from: "HYD", to: "CCU", date: "2026-12-01", amount: 4000 }),
      expect.objectContaining({ from: "CCU", to: "HYD", date: "2026-12-05", amount: 3900 }),
    ]);
    repo.save.mockClear();
    service.remember(criteria({ tripType: "roundTrip", return: "2026-12-05" }), trips({ COMBO: [9000] }));
    service.remember(criteria({ tripType: "multiCity" }), trips({ "0": [3000] }));
    expect(repo.save).not.toHaveBeenCalled();
  });

  it("returns fresh prices for the requested days", async () => {
    const { repo, service } = setup();
    const calendar = await service.calendar("HYD", "CCU", "economy", "2026-12-01", 31);
    expect(repo.range).toHaveBeenCalledWith("HYD", "CCU", "economy", "2026-12-01", "2026-12-31", expect.any(Date));
    expect(calendar).toEqual({ currency: "INR", days: [{ date: "2026-12-01", amount: 4100 }] });
  });
});
