// Checks the TripJack connection with two read-only calls. Prints whether the
// key works from this machine; never prints the key.
// Usage: yarn workspace @quickhotels/backend tripjack:check
const key = process.env.TRIPJACK_API_KEY?.trim();
const hms = (process.env.TRIPJACK_HMS_BASE_URL || "https://apitest-hms.tripjack.com").replace(/\/+$/, "");
if (!key) {
  console.error("TRIPJACK_API_KEY is not set in apps/backend/.env");
  process.exit(1);
}

const ip = await fetch("https://api.ipify.org").then((r) => r.text()).catch(() => "unknown");
console.log(`Host: ${hms}\nThis machine's public IP: ${ip}\n`);

let ok = true;
for (const [label, path] of [
  ["Countries", "/hms/v3/content/fetch-countries"],
  ["City regions (first 5)", "/hms/v3/content/fetch-city-regionIds?limit=5"],
]) {
  try {
    const response = await fetch(`${hms}${path}`, { headers: { apikey: key, Accept: "application/json" }, signal: AbortSignal.timeout(20_000) });
    const data = await response.json().catch(() => ({}));
    if (response.ok && data.status?.success !== false) {
      const count = (data.hotelCountries ?? data.hotelCityRegionIds ?? []).length;
      console.log(`✔ ${label}: OK (${count} items)`);
    } else {
      ok = false;
      const message = data.errors?.map((e) => e.message).join("; ") || `HTTP ${response.status}`;
      console.log(`✘ ${label}: ${message}`);
    }
  } catch (error) {
    ok = false;
    console.log(`✘ ${label}: ${error.message}`);
  }
}
if (!ok) {
  console.log(`\nIf it says the IP isn't whitelisted, add ${ip} in the TripJack portal (see TripJack's API key guide), then run this again.`);
  process.exit(1);
}
