import { describe, expect, it } from "vitest";
import { buildMime } from "./mime.js";

const decodePart = (mime: string, type: string) => {
  const part = mime.split(`Content-Type: ${type}; charset=UTF-8`)[1]!.split("\r\n\r\n")[1]!.split("\r\n--")[0]!;
  return Buffer.from(part.replace(/\r\n/g, ""), "base64").toString("utf8");
};

describe("buildMime", () => {
  it("builds a text + HTML email with encoded non-ASCII headers", () => {
    const mime = buildMime({ from: "QuickHotels24/7 <a@b.com>", to: "Asha Rao <asha@example.com>", subject: "Your stay ₹2,499", text: "Hi ₹", html: "<p>Hi ₹</p>" });
    expect(mime).toContain("From: QuickHotels24/7 <a@b.com>");
    expect(mime).toContain("To: Asha Rao <asha@example.com>");
    expect(mime).toMatch(/Subject: =\?UTF-8\?B\?.+\?=/);
    expect(mime).toContain("multipart/alternative");
    expect(decodePart(mime, "text/plain")).toBe("Hi ₹");
    expect(decodePart(mime, "text/html")).toBe("<p>Hi ₹</p>");
  });

  it("keeps base64 lines within 76 characters", () => {
    const mime = buildMime({ from: "a@b.com", to: "c@d.com", subject: "Hi", text: "x".repeat(500), html: "y".repeat(500) });
    expect(mime.split("\r\n").every((line) => line.length <= 998)).toBe(true);
    expect(mime.split("\r\n").filter((line) => /^[A-Za-z0-9+/=]+$/.test(line)).every((line) => line.length <= 76)).toBe(true);
  });
});
