import { describe, expect, it } from "vitest";
import { frontendUrlFromEnv } from "./auth.config.js";

describe("frontendUrlFromEnv", () => {
  it("uses the website origin for the auth handoff", () => {
    expect(frontendUrlFromEnv("https://quickhotels247.com/")).toBe("https://quickhotels247.com");
  });

  it("uses only the first origin when multiple origins are mistakenly configured", () => {
    expect(
      frontendUrlFromEnv("https://quickhotels247.com,https://www.quickhotels247.com"),
    ).toBe("https://quickhotels247.com");
  });

  it("uses the local website in development when unset", () => {
    expect(frontendUrlFromEnv(undefined)).toBe("http://localhost:3000");
  });
});
