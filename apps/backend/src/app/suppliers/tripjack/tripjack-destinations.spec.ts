import { describe, expect, it } from "vitest";
import { aliasTargets, titleCase, toSuggestions, type RegionRow } from "./tripjack-destinations.js";

const row = (changes: Partial<RegionRow>): RegionRow => ({
  regionId: "1", name: "HYDERABAD", countryName: "INDIA", regionType: "CITY",
  fullName: "HYDERABAD, TELANGANA, INDIA", hotelCount: null, ...changes,
});

describe("destination suggestions", () => {
  it("title-cases TripJack's upper-case names", () => {
    expect(titleCase("NEW DELHI")).toBe("New Delhi");
    expect(titleCase("UNITED STATES OF AMERICA")).toBe("United States of America");
    expect(titleCase("PORT BLAIR-ANDAMAN")).toBe("Port Blair-Andaman");
  });

  it("offers one entry per place, with the country in the search text", () => {
    const suggestions = toSuggestions(
      [
        row({ regionId: "v", regionType: "MULTI_CITY_VICINITY", hotelCount: 2363 }),
        row({ regionId: "c", hotelCount: 2142 }),
        row({ regionId: "p", countryName: "PAKISTAN", fullName: "HYDERABAD, SINDH, PAKISTAN", hotelCount: 15 }),
      ],
      8,
    );
    expect(suggestions).toEqual([
      { id: "v", name: "Hyderabad", detail: "Telangana, India", kind: "city", query: "Hyderabad, India", hotelCount: 2363 },
      { id: "p", name: "Hyderabad", detail: "Sindh, Pakistan", kind: "city", query: "Hyderabad, Pakistan", hotelCount: 15 },
    ]);
  });

  it("stops at the limit", () => {
    const rows = ["GOA", "GOALPARA", "GOKARNA"].map((name, i) => row({ regionId: String(i), name, fullName: `${name}, INDIA` }));
    expect(toSuggestions(rows, 2).map((s) => s.name)).toEqual(["Goa", "Goalpara"]);
  });

  it("knows old names from their first letters", () => {
    expect(aliasTargets("bangal")).toEqual(["BENGALURU"]);
    expect(aliasTargets("ba")).toEqual([]);
  });
});
