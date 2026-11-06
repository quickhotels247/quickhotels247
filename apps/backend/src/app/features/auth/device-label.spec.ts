import { describe, expect, it } from "vitest";
import { deviceLabel } from "./device-label.js";

describe("deviceLabel", () => {
  it("names common browsers and systems", () => {
    expect(deviceLabel("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36")).toBe("Chrome on macOS");
    expect(deviceLabel("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1")).toBe("Safari on iOS");
    expect(deviceLabel("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36 Edg/130.0")).toBe("Edge on Windows");
    expect(deviceLabel("Mozilla/5.0 (Linux; Android 14) Gecko/130.0 Firefox/130.0")).toBe("Firefox on Android");
  });

  it("returns null when unknown", () => {
    expect(deviceLabel(undefined)).toBeNull();
    expect(deviceLabel("curl/8.0")).toBeNull();
  });
});
