import { randomUUID } from "node:crypto";
import {
  GoneException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import type {
  HotelFilters,
  HotelSearchRequest,
  HotelSearchResponse,
  HotelSearchResult,
  HotelSort,
  SearchCentre,
} from "@quickhotels/types/hotels";
import { HOTEL_SUPPLIER, type HotelSupplier } from "../../suppliers/hotel-supplier.js";
import { SupplierError, supplierHttpError } from "../../suppliers/supplier-error.js";
import { filterHotels, hotelFacets } from "./hotel-filters.js";
import { sortHotels } from "./hotel-sort.js";
import { checkStay, nightsOf } from "./stay-rules.js";
import { SearchSessionsRepository } from "./search-sessions.repository.js";

export interface Paging {
  page: number;
  pageSize: number;
  sort: HotelSort;
  filters?: HotelFilters;
}

const DEFAULT_PAGING: Paging = { page: 1, pageSize: 20, sort: "recommended" };
// Extra supplier batches one page request may trigger.
const MAX_EXTRA_BATCHES = 3;

// Joins the supplier context of later batches onto the first (TripJack keeps
// a list of listing batches; other suppliers' contexts are replaced).
function mergeContexts(previous: unknown, next: unknown): unknown {
  const a = previous as { batches?: unknown[] } | null;
  const b = next as { batches?: unknown[] } | null;
  if (a?.batches && b?.batches) return { ...a, batches: [...a.batches, ...b.batches] };
  return next ?? previous;
}


// Hotel search (spec §4.1–4.2, §7.1): checks the request, asks the active
// supplier, records the search session with its priced hotels, and serves
// them page by page, pricing more hotels when a page needs them.
@Injectable()
export class HotelsService {
  private readonly logger = new Logger(HotelsService.name);

  constructor(
    @Inject(HOTEL_SUPPLIER) private readonly supplier: HotelSupplier,
    private readonly sessions: SearchSessionsRepository,
  ) {}

  // Starts a search: prices the first batch of hotels and returns page 1.
  async search(request: HotelSearchRequest, userId: string | null, paging: Paging = DEFAULT_PAGING): Promise<HotelSearchResponse> {
    const nights = checkStay(request);

    const found = await this.callSupplier(request);
    const searchId = await this.sessions.create({
      request,
      userId,
      supplier: this.supplier.name,
      supplierSearchId: found.supplierSearchId,
      supplierContext: found.context ?? null,
      results: found.results,
      nextCursor: found.nextCursor ?? null,
      centre: found.centre ?? null,
      expiresAt: found.expiresAt,
    });
    return this.page(
      {
        id: searchId,
        request,
        results: found.results,
        nextCursor: found.nextCursor ?? null,
        centre: found.centre ?? null,
        expiresAt: found.expiresAt,
      },
      nights,
      paging,
    );
  }

  // Another page of an existing search. Prices more hotels first when the
  // page goes past what's been priced and the supplier has more.
  async results(searchId: string, paging: Paging): Promise<HotelSearchResponse> {
    const stored = await this.sessions.find(searchId);
    if (!stored) throw new NotFoundException("This search doesn't exist.");
    if (stored.expiresAt.getTime() <= Date.now()) {
      throw new GoneException("These prices have expired. Please search again for current prices.");
    }
    if (stored.supplier !== this.supplier.name) throw new GoneException("Please search again.");

    let { results, nextCursor, supplierContext } = stored;
    const needed = paging.page * paging.pageSize;
    // Each supplier batch may come back with few available (or matching)
    // hotels; keep going until the page is full or the supplier runs out (a
    // few batches at most).
    for (let batches = 0; filterHotels(results, paging.filters).length < needed && nextCursor && batches < MAX_EXTRA_BATCHES; batches++) {
      const more = await this.callSupplier(stored.request, nextCursor);
      const seen = new Set(results.map((hotel) => hotel.id));
      results = [...results, ...more.results.filter((hotel) => !seen.has(hotel.id))];
      nextCursor = more.nextCursor ?? null;
      supplierContext = mergeContexts(supplierContext, more.context);
      await this.sessions.saveMore(searchId, results, nextCursor, supplierContext);
    }
    return this.page({ ...stored, results, nextCursor }, nightsOf(stored.request), paging);
  }

  private page(
    search: {
      id: string;
      request: HotelSearchRequest;
      results: HotelSearchResult[];
      nextCursor: unknown;
      centre: SearchCentre | null;
      expiresAt: Date;
    },
    nights: number,
    { page, pageSize, sort, filters = {} }: Paging,
  ): HotelSearchResponse {
    const matching = filterHotels(search.results, filters);
    const sorted = sortHotels(matching, sort);
    const start = (page - 1) * pageSize;
    return {
      searchId: search.id,
      expiresAt: search.expiresAt.toISOString(),
      criteria: search.request,
      nights,
      page,
      pageSize,
      sort,
      filters,
      centre: search.centre,
      total: matching.length,
      priced: search.results.length,
      facets: hotelFacets(search.results),
      complete: !search.nextCursor,
      hasMore: matching.length > start + pageSize || Boolean(search.nextCursor),
      results: sorted.slice(start, start + pageSize),
      sample: this.supplier.sample,
    };
  }

  private async callSupplier(request: HotelSearchRequest, cursor?: unknown) {
    const correlationId = randomUUID();
    try {
      return await this.supplier.searchHotels(request, { correlationId }, { cursor });
    } catch (error) {
      if (!(error instanceof SupplierError)) throw error;
      // Full details go to the log; the customer gets a safe message and a reference.
      this.logger.warn(`${error.supplier} search failed (${error.code}, ref ${error.correlationId}): ${error.message}`);
      throw supplierHttpError(error);
    }
  }
}
