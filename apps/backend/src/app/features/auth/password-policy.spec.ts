import { describe, expect, it } from "vitest";
import { checkPasswordPolicy } from "./password-policy.js";

describe("checkPasswordPolicy", () => {
  it("accepts a password with 8+ characters, a letter and a number", () => {
    expect(checkPasswordPolicy("Passw0rd")).toBeNull();
  });

  it("rejects short passwords", () => {
    expect(checkPasswordPolicy("Pa55")).toMatch(/at least 8/);
  });

  it("rejects passwords without a number", () => {
    expect(checkPasswordPolicy("Password")).toMatch(/letter and a number/);
  });

  it("rejects passwords without a letter", () => {
    expect(checkPasswordPolicy("12345678")).toMatch(/letter and a number/);
  });

  it("rejects passwords over 128 characters", () => {
    expect(checkPasswordPolicy("a1".repeat(65))).toMatch(/at most 128/);
  });
});
