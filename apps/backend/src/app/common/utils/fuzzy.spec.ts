import { describe, expect, it } from "vitest";
import { fuzzyDistance, fuzzyIncludes } from "./fuzzy.js";

describe("fuzzy matching", () => {
  it("counts the fewest edits for the word to appear in the text", () => {
    expect(fuzzyDistance("shamshabad", "w hotel shamshabad")).toBe(0);
    expect(fuzzyDistance("shamsabad", "w hotel shamshabad")).toBe(1);
    expect(fuzzyDistance("secundrabad", "brindavan colony, secunderabad")).toBe(1);
  });

  it("allows typos in longer words only", () => {
    expect(fuzzyIncludes("shamsabad", "shamshabad, hyderabad")).toBe(true);
    expect(fuzzyIncludes("banjra", "road no 2, banjara hills")).toBe(true);
    expect(fuzzyIncludes("taj", "the tak palace")).toBe(false);
    expect(fuzzyIncludes("gachibowli", "secunderabad")).toBe(false);
  });
});
