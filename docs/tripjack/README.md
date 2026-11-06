# TripJack API notes

**Source:** TripJack's partner documentation at https://tripjack.com/page/api-doc (it covers both flights and hotels). Postman collections: https://documenter.getpostman.com/view/4351557/2sBYAyup83 and the hotel collection at https://s3.ap-south-1.amazonaws.com/static.tripjack.com/hotel/API+OUT+V2.postman_collection.json.
`hotel-api-v3.txt` is a plain-text copy of the Hotel API v3 reference, taken on 2026-11-04 for offline reading. Check the live page for changes.

## Access

- **Staging account:** sent by TripJack by email, 2026-11-03. The key goes only in `apps/backend/.env` as `TRIPJACK_API_KEY`. Never commit it or paste it anywhere.
- **IP whitelisting:** the key only works from whitelisted IPv4 addresses. Without it, every call returns 403 "None of the client IP headers are whitelisted for this API key". Whitelist each developer machine's public IP (`curl -s https://api.ipify.org`) and, later, the servers' fixed IPs.
- **Auth:** an `apikey: <key>` header on every request, plus `Content-Type: application/json` on POST requests.
- **`correlationId`:** required on Listing, Detail and Review. Use the same value for one customer search through all three.

## Hosts

| Use | UAT (testing) | Production (only after certification) |
|---|---|---|
| Nationalities, static content, Listing, Detail (pricing), Review | `https://apitest-hms.tripjack.com` | `https://hms-search.tripjack.com` |
| Book, Booking details, Booking list, Cancel | `https://apitest-hotel-booker.tripjack.com` | `https://hms-booker.tripjack.com` |

The paths are the same on both. Some doc examples use `apitest.tripjack.com` for nationalities and the older static APIs.

## Hotel v3 flow

1. **Static content (cache it locally):**
   - `GET /hms/v3/content/fetch-city-regionIds?limit=2000&cursor=…` lists cities with their `cityRegionId`.
   - `POST /hms/v3/content/fetch-hotel-mapping` with `{ regionIds | countryName, page, size ≤ 2000 }` returns the `tjHotelId`s.
   - `POST /hms/v3/content/fetch-hotel-content` with `{ hotelIds (≤ 100), isAllImagesRequired }` returns name, stars, property type, address, coordinates, amenities, images and descriptions.
   - `GET /hms/v3/nationality-info` returns `countryId` for the `nationality` field.
2. **Listing:** `POST /hms/v3/hotel/listing` with `{ checkIn, checkOut, rooms[{adults, children, childAge[]}], currency, correlationId, nationality, timeoutMs, hids (≤ 100) }`. Returns `correlationId`, `totalResults` and `hotels[].tjHotelId/name/options[]` (the cheapest options). The `correlationId` identifies the search session (about 15 minutes). The docs' overview calls this the searchId, but the request bodies only use `correlationId`, the same dates and rooms, and `hid` for Detail.
3. **Detail:** `POST /hms/v3/hotel/pricing` returns every option for one hotel, with the cancellation policy embedded.
4. **Review:** `POST /hms/v3/hotel/review` re-validates the price and availability and returns the `reviewId`. Call Book right after.
5. **Book:** `POST /oms/v3/hotel/book`, either instant or hold, then `/oms/v3/hotel/confirm-book`. Also `/oms/v3/hotel/booking-details`, `/oms/v3/hotel/bookings` and `/oms/v3/hotel/cancel-booking/{bookingId}`.

**Prices:** `totalPrice = basePrice + taxes + mf + mft`. Show the management fee (`mf`) and its tax (`mft`) as separate lines in the price breakup.

## UAT findings

- **Review returns `OPTION_SOLD_OUT` for every rate (2026-11-05).** Listing and Pricing work, but Review answered `errorType: OPTION_SOLD_OUT` (errCode 6506) for every option tried: 3 rates at one Hyderabad hotel and the cheapest rate at 4 hotels in Goa, Delhi and Mumbai, with and without the stay in the request. Our requests follow the v3 docs, and Review does recognise our options: an optionId from Listing (not Detail) gets `OPTION_ID_NOT_FOUND` instead, so the request reaches the right rate and the sold-out answer comes from the UAT inventory. Example for support: correlationId `f3069f06-aeef-44ac-86e7-68f4af96742a`, hid `100000620177`, 2026-11-05 06:10 UTC. Re-checked 2026-11-05 12:12 UTC with `yarn workspace @quickhotels/backend tripjack:trace` (saves every request/response, without the key, to `docs/tripjack/logs/`): same result for 3 options at hid `100000620177`, correlationId `1da716d9-bed7-4038-9412-d408adf1bceb`; sending `hid` as a number makes no difference. TripJack support (Arun Singh Bhati) asked for logs and the user ID (113787). **Ask TripJack:** which UAT hotels or test cases complete Review and Book, and whether Review needs anything beyond `correlationId`, `optionId`, `reviewHash` and `hid`.
- **Errors carry `errorType`** (e.g. `OPTION_SOLD_OUT`) besides `errCode` and `message`; the client includes it in SupplierError messages.
- **The key only works from whitelisted IPs** and the error can read "Invalid API key" rather than "IP not whitelisted" when the IP changed. Run `tripjack:check` first.

## Go-live

TripJack requires self-certification: send the JSON requests and responses and the confirmation numbers for their test cases. After sign-off they issue live access and whitelist the production IPs.
