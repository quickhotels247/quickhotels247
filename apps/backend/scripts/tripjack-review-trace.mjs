// Runs Hotel v3 Listing → Pricing (Detail) → Review for one hotel on TripJack
// and saves every request and response (with timings) to docs/tripjack/logs/,
// for TripJack support and self-certification. The apikey is never written.
// Usage: yarn workspace @quickhotels/backend tripjack:trace [hid] [checkIn] [nights] [maxOptions]
//   e.g. tripjack:trace 100000620177 2026-11-20 1 3
import { mkdirSync, writeFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const key = process.env.TRIPJACK_API_KEY?.trim();
const hms = (process.env.TRIPJACK_HMS_BASE_URL || "https://apitest-hms.tripjack.com").replace(/\/+$/, "");
if (!key) {
  console.error("TRIPJACK_API_KEY is not set in apps/backend/.env");
  process.exit(1);
}
const isoDay = (offset) => new Date(Date.now() + offset * 86_400_000).toISOString().slice(0, 10);
const [hid = "100000620177", checkIn = isoDay(14), nightsArg = "1", maxArg = "3"] = process.argv.slice(2);
const nights = Number(nightsArg) || 1;
const checkOut = new Date(new Date(`${checkIn}T00:00:00Z`).getTime() + nights * 86_400_000).toISOString().slice(0, 10);
const stay = { checkIn, checkOut, rooms: [{ adults: 2 }], currency: "INR", nationality: process.env.TRIPJACK_NATIONALITY_ID || "106" };

const steps = [];
async function call(step, path, body) {
  const started = new Date();
  let status = 0;
  let response;
  try {
    const res = await fetch(`${hms}${path}`, {
      method: "POST",
      headers: { apikey: key, Accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(45_000),
    });
    status = res.status;
    const text = await res.text();
    try {
      response = JSON.parse(text);
    } catch {
      response = text;
    }
  } catch (error) {
    response = { networkError: error.message };
  }
  const entry = { step, time: started.toISOString(), durationMs: Date.now() - started.getTime(), request: { method: "POST", url: `${hms}${path}`, body }, httpStatus: status, response };
  steps.push(entry);
  const errors = response?.errors?.map((e) => `${e.errCode} ${e.errorType ?? ""} ${e.message}`.trim()).join("; ");
  console.log(`${step}: HTTP ${status} in ${entry.durationMs} ms${errors ? ` — ${errors}` : ""}`);
  return response;
}

const correlationId = randomUUID();
console.log(`Host ${hms} · hid ${hid} · ${checkIn} → ${checkOut} · 2 adults · correlationId ${correlationId}\n`);
const listing = await call("1. listing", "/hms/v3/hotel/listing", { ...stay, correlationId, hids: [Number(hid)] });
const session = listing?.correlationId || correlationId;
let reviewed = 0;
if (listing?.hotels?.length) {
  const pricing = await call("2. pricing", "/hms/v3/hotel/pricing", { ...stay, correlationId: session, hid });
  const options = [...(pricing?.options ?? [])].sort((a, b) => (a.pricing?.totalPrice ?? 0) - (b.pricing?.totalPrice ?? 0));
  console.log(`   ${options.length} options, reviewHash ${pricing?.reviewHash ? "present" : "MISSING"}`);
  for (const option of options.slice(0, Number(maxArg) || 3)) {
    const optionId = option.optionId ?? option.id;
    await call(`3. review option ${optionId}`, "/hms/v3/hotel/review", { correlationId: session, optionId, reviewHash: pricing.reviewHash, hid });
    reviewed += 1;
  }
} else {
  console.log("   Listing returned no hotels for this stay; try another date or hid.");
}

const here = dirname(fileURLToPath(import.meta.url));
const out = resolve(here, "../../../docs/tripjack/logs", `review-trace-${new Date().toISOString().replace(/[:.]/g, "-")}.json`);
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, JSON.stringify({ host: hms, hid, stay, correlationId: session, reviewed, steps }, null, 2));
console.log(`\nSaved ${steps.length} calls to ${out}`);
