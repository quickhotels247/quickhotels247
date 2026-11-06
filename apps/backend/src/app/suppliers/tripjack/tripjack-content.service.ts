import { Inject, Injectable, Logger } from "@nestjs/common";
import { chunk, mapLimit } from "../../common/utils/map-limit.js";
import { TripjackClient } from "./tripjack.client.js";
import { tripjackConfig, type TripjackConfig } from "./tripjack.config.js";
import { TripjackContentRepository, type RegionRow, type RegionWithSync } from "./tripjack-content.repository.js";
import { contentToRow } from "./tripjack.mapper.js";
import type {
  TripjackCityRegionsResponse,
  TripjackHotelContentResponse,
  TripjackHotelMappingResponse,
} from "./tripjack.types.js";

const REGIONS_PAGE = 2000; // TripJack's maximum
const MAPPING_PAGE = 2000; // TripJack's maximum
const CONTENT_BATCH = 100; // TripJack's maximum
const CONTENT_CONCURRENCY = 6;

// Keeps our copy of TripJack's static content (TripJack asks partners to
// cache it, and to refresh it about weekly): all regions, and each region's
// hotels with their content, pulled the first time someone searches there.
@Injectable()
export class TripjackContentService {
  private readonly logger = new Logger(TripjackContentService.name);
  // A region being synced, so parallel searches share one sync.
  private readonly inFlight = new Map<string, Promise<void>>();

  constructor(
    private readonly client: TripjackClient,
    private readonly content: TripjackContentRepository,
    @Inject(tripjackConfig.KEY) private readonly config: TripjackConfig,
  ) {}

  // All of TripJack's cities, areas and states (about 330,000; ~30 s to fetch).
  async syncRegions(onPage?: (done: number) => void): Promise<number> {
    let cursor: string | undefined;
    let total = 0;
    do {
      const page = await this.client.request<TripjackCityRegionsResponse>("cityRegions", {
        query: { limit: REGIONS_PAGE, cursor },
      });
      const rows: RegionRow[] = (page.hotelCityRegionIds ?? []).map((region) => ({
        regionId: String(region.cityRegionId),
        name: region.regionName,
        cityName: region.cityName,
        countryName: region.countryName,
        regionType: region.regionType,
        fullName: region.fullRegionName,
      }));
      await this.content.upsertRegions(rows);
      total += rows.length;
      onPage?.(total);
      cursor = page.hasMore ? page.nextCursor : undefined;
    } while (cursor);
    return total;
  }

  // Hotels TripJack lists for the region: the count from our last sync, or
  // one small mapping call (page size 1) when we haven't synced it yet.
  async countRegionHotels(region: RegionWithSync): Promise<number | null> {
    if (region.hotelCount !== null) return region.hotelCount;
    const mapping = await this.client.request<TripjackHotelMappingResponse>("hotelMapping", {
      body: { regionIds: [region.regionId], page: 0, size: 1 },
    });
    const count = mapping.pageable?.totalElements ?? null;
    if (count !== null) await this.content.setRegionHotelCount(region.regionId, count);
    return count;
  }

  hasRegions() {
    return this.content.countRegions().then((count) => count > 0);
  }

  // Makes sure the region's hotels and content are in our database and less
  // than a week old. The first search in a city waits for this (a few seconds).
  async ensureRegionHotels(region: RegionWithSync): Promise<void> {
    const fresh = region.hotelsSyncedAt && Date.now() - region.hotelsSyncedAt.getTime() < this.config.contentMaxAgeMs;
    if (fresh) return;
    const running = this.inFlight.get(region.regionId);
    if (running) return running;
    const sync = this.syncRegionHotels(region.regionId).finally(() => this.inFlight.delete(region.regionId));
    this.inFlight.set(region.regionId, sync);
    return sync;
  }

  private async syncRegionHotels(regionId: string): Promise<void> {
    const started = Date.now();
    const hotelIds: string[] = [];
    for (let page = 0; ; page++) {
      const mapping = await this.client.request<TripjackHotelMappingResponse>("hotelMapping", {
        body: { regionIds: [regionId], page, size: MAPPING_PAGE },
      });
      hotelIds.push(...(mapping.hotels ?? []).map((hotel) => String(hotel.tjHotelId)));
      if (page + 1 >= (mapping.pageable?.totalPages ?? 1)) break;
    }

    const batches = chunk(hotelIds, CONTENT_BATCH);
    const results = await mapLimit(batches, CONTENT_CONCURRENCY, async (ids) => {
      const response = await this.client.request<TripjackHotelContentResponse>("hotelContent", {
        body: { hotelIds: ids, isAllImagesRequired: false },
      });
      await this.content.upsertHotels((response.hotels ?? []).map((hotel) => contentToRow(hotel, regionId)));
    });
    const failed = results.filter((result) => "error" in result).length;
    if (failed === batches.length && batches.length) throw (results[0] as { error: unknown }).error;
    if (failed) this.logger.warn(`Region ${regionId}: ${failed} of ${batches.length} content batches failed; they retry next sync.`);
    // A partly failed sync is retried sooner by not marking it synced.
    if (!failed) await this.content.markRegionSynced(regionId, hotelIds.length);
    this.logger.log(`Region ${regionId}: ${hotelIds.length} hotels synced in ${Date.now() - started} ms.`);
  }
}
