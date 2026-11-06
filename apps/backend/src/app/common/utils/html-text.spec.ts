import { describe, expect, it } from "vitest";
import { htmlToParagraphs } from "./html-text.js";

describe("htmlToParagraphs", () => {
  it("turns HTML into plain paragraphs", () => {
    expect(htmlToParagraphs("<p>Near the <b>beach</b> &amp; fort.</p><ul><li>Pool</li><li>Spa</li></ul>Late check-out<br/>on request")).toEqual([
      "Near the beach & fort.",
      "Pool",
      "Spa",
      "Late check-out",
      "on request",
    ]);
  });

  it("drops scripts and styles entirely", () => {
    expect(htmlToParagraphs('<script>alert("x")</script><style>p{}</style><p>Hello&#33;</p>')).toEqual(["Hello!"]);
  });

  it("handles empty input", () => {
    expect(htmlToParagraphs(null)).toEqual([]);
    expect(htmlToParagraphs("<p> </p>")).toEqual([]);
  });
});
