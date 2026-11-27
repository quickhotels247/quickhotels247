import { describe, expect, it } from "vitest";
import { panProblem } from "./pan.js";

describe("panProblem", () => {
  it("accepts a personal PAN whose 5th letter is the surname's initial", () => {
    expect(panProblem("abcpn1234d", "Vinod", "Nayak")).toBeNull();
    // Names entered the other way round still pass.
    expect(panProblem("ABCPV1234D", "Vinod", "Nayak")).toBeNull();
  });

  it("explains what's wrong, as TripJack would reject it after payment", () => {
    expect(panProblem("ABCD1234F", "Vinod", "Nayak")).toMatch(/10 characters/);
    expect(panProblem("ABCDE1234F", "Vinod", "Nayak")).toMatch(/4th letter must be P/);
    expect(panProblem("ABCPE1234F", "Vinod", "Nayak")).toMatch(/first letter of the surname \(N\)/);
  });
});
