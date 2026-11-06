// Supplier text often arrives as HTML. We show it as plain paragraphs, never
// as HTML, so nothing from a supplier can run or restyle our pages.

const ENTITIES: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", ndash: "–", mdash: "—", rsquo: "’", lsquo: "‘", rdquo: "”", ldquo: "“", hellip: "…", bull: "•" };

function decode(text: string) {
  return text.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (whole, code: string) => {
    if (code[0] === "#") {
      const point = code[1]?.toLowerCase() === "x" ? parseInt(code.slice(2), 16) : parseInt(code.slice(1), 10);
      return Number.isFinite(point) && point > 0 && point < 0x110000 ? String.fromCodePoint(point) : "";
    }
    return ENTITIES[code.toLowerCase()] ?? whole;
  });
}

// "<p>Near the beach.</p><ul><li>Pool</li></ul>" → ["Near the beach.", "Pool"].
export function htmlToParagraphs(html: string | null | undefined): string[] {
  if (!html) return [];
  const text = html
    .replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|li|h[1-6]|tr|ul|ol)>/gi, "\n")
    .replace(/<li[^>]*>/gi, "\n")
    // Inline tags sit inside words and sentences; other tags separate text.
    .replace(/<\/?(b|i|u|em|strong|span|a|small|sup|sub)\b[^>]*>/gi, "")
    .replace(/<[^>]+>/g, " ");
  return decode(text)
    .split(/\n+/)
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean);
}
