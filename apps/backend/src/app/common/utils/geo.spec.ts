import { describe, expect, it } from "vitest";
import { distanceKm } from "./geo.js";

describe("distanceKm", () => {
  it("measures straight-line distance to one decimal", () => {
    // Charminar → Hyderabad's HITEC City is about 14 km apart.
    const km = distanceKm({ lat: 17.3616, lng: 78.4747 }, { lat: 17.4474, lng: 78.3762 });
    expect(km).toBeGreaterThan(13);
    expect(km).toBeLessThan(15);
    expect(distanceKm({ lat: 10, lng: 10 }, { lat: 10, lng: 10 })).toBe(0);
  });
});
