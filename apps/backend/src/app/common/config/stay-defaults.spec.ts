import { describe, expect, it } from "vitest";
import { addDays, todayInIndia } from "../utils/india-dates.js";
import { defaultSearchStay } from "./stay-defaults.js";

describe("defaultSearchStay", () => {
  it("is today → tomorrow in India", () => {
    const today = todayInIndia();
    expect(defaultSearchStay()).toEqual({ checkIn: today, checkOut: addDays(today, 1) });
  });
});
