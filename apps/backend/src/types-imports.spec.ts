import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

// @quickhotels/types holds TypeScript source and isn't in the production
// image, so the backend may only use `import type` from it. A value import
// compiles fine but crashes the deployed server on start.
function files(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return name === "generated" ? [] : files(path);
    return path.endsWith(".ts") && !path.endsWith(".spec.ts") ? [path] : [];
  });
}

describe("@quickhotels/types imports", () => {
  it("are type-only in backend code", () => {
    const offenders = files(join(import.meta.dirname, "app")).filter((path) =>
      /^import\s+(?!type\b)[^;]*from\s+["']@quickhotels\/types/m.test(readFileSync(path, "utf8")),
    );
    expect(offenders).toEqual([]);
  });
});
