// Spelling-tolerant matching for what guests type (e.g. "shamsabad" finds
// "Shamshabad"). The API has the same rules in
// apps/backend/src/app/common/utils/fuzzy.ts (it filters; this suggests).

// Fewest letters to add, drop or change for `word` to appear somewhere in
// `text` (both lower case): 0 when it's already there.
export function fuzzyDistance(word: string, text: string): number {
  const m = word.length;
  const column = Array.from({ length: m + 1 }, (_, i) => i);
  let best = m;
  for (const letter of text) {
    let diagonal = column[0]!;
    column[0] = 0;
    for (let i = 1; i <= m; i++) {
      const above = column[i]!;
      column[i] = Math.min(above + 1, column[i - 1]! + 1, diagonal + (word[i - 1] === letter ? 0 : 1));
      diagonal = above;
    }
    best = Math.min(best, column[m]!);
  }
  return best;
}

// Mistakes allowed for a word of this length: none for short words, where
// one wrong letter already means something else.
export const allowedTypos = (length: number) => (length >= 8 ? 2 : length >= 4 ? 1 : 0);

// The word is in the text, allowing a few typos for longer words.
export const fuzzyIncludes = (word: string, text: string) =>
  text.includes(word) || (allowedTypos(word.length) > 0 && fuzzyDistance(word, text) <= allowedTypos(word.length));
