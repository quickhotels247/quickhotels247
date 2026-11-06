import { randomUUID } from "node:crypto";
import {
  BadRequestException,
  GoneException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import type { FlightFilters, FlightSearchCriteria, FlightSearchResponse, FlightSort } from "@quickhotels/types/flights";
import { addDays, todayInIndia } from "../../../common/utils/india-dates.js";
import { FLIGHT_SUPPLIER, type FlightSupplier, type FlightTrip } from "../../../suppliers/flight-supplier.js";
import { SupplierError, supplierHttpError } from "../../../suppliers/supplier-error.js";
import { filterFlights, flightFacets, flightHighlights } from "./flight-filters.js";
import { sortFlights } from "./flight-sort.js";
import { FlightSearchSessionsRepository, type StoredFlightSearch } from "./flight-search-sessions.repository.js";

export interface FlightPaging {
  trip?: string;
  page: number;
  pageSize: number;
  sort: FlightSort;
  filters?: FlightFilters;
}

const DEFAULT_PAGING: FlightPaging = { page: 1, pageSize: 20, sort: "price" };
const MAX_DAYS_AHEAD = 360;

// Flight search (flights track F2–F3): checks the request, asks the flight
// supplier, stores every fare with the session, and serves them page by page
// per trip ("ONWARD", "RETURN", "COMBO"…), sorted and filtered.
@Injectable()
export class FlightSearchService {
  private readonly logger = new Logger(FlightSearchService.name);

  constructor(
    @Inject(FLIGHT_SUPPLIER) private readonly supplier: FlightSupplier,
    private readonly sessions: FlightSearchSessionsRepository,
  ) {}

  async search(criteria: FlightSearchCriteria, userId: string | null, paging: FlightPaging = DEFAULT_PAGING): Promise<FlightSearchResponse> {
    this.check(criteria);
    const found = await this.callSupplier(criteria);
    const id = await this.sessions.create({ criteria, userId, supplier: this.supplier.name, trips: found.trips, expiresAt: found.expiresAt });
    return this.page({ id, criteria, supplier: this.supplier.name, trips: found.trips, expiresAt: found.expiresAt }, paging);
  }

  async results(searchId: string, paging: FlightPaging): Promise<FlightSearchResponse> {
    const stored = await this.sessions.find(searchId);
    if (!stored) throw new NotFoundException("This search doesn't exist.");
    if (stored.expiresAt.getTime() <= Date.now()) {
      throw new GoneException("These fares have expired. Please search again for current fares.");
    }
    return this.page(stored, paging);
  }

  // Search without saving a session (used for popular-route fares).
  async quickSearch(criteria: FlightSearchCriteria): Promise<FlightTrip[]> {
    this.check(criteria);
    return (await this.callSupplier(criteria)).trips;
  }

  private page(search: StoredFlightSearch, { trip, page, pageSize, sort, filters = {} }: FlightPaging): FlightSearchResponse {
    const chosen = search.trips.find((item) => item.key === trip) ?? search.trips[0];
    if (trip && chosen?.key !== trip) throw new BadRequestException(`This search has no "${trip}" list.`);
    const all = chosen?.options ?? [];
    const matching = filterFlights(all, filters);
    const sorted = sortFlights(matching, sort);
    const start = (page - 1) * pageSize;
    return {
      searchId: search.id,
      expiresAt: search.expiresAt.toISOString(),
      criteria: search.criteria,
      trips: search.trips.map((item) => ({ key: item.key, label: item.label, total: item.options.length })),
      trip: chosen?.key ?? "ONWARD",
      page,
      pageSize,
      sort,
      filters,
      facets: flightFacets(all),
      highlights: flightHighlights(matching),
      total: sorted.length,
      hasMore: sorted.length > start + pageSize,
      results: sorted.slice(start, start + pageSize),
    };
  }

  private check(criteria: FlightSearchCriteria) {
    const today = todayInIndia();
    const latest = addDays(today, MAX_DAYS_AHEAD);
    const dates =
      criteria.tripType === "multiCity"
        ? criteria.legs.map((leg) => leg.depart)
        : [criteria.depart, ...(criteria.tripType === "roundTrip" ? [criteria.return] : [])];
    if (dates.some((date) => date < today)) throw new BadRequestException("Travel dates can't be in the past.");
    if (dates.some((date) => date > latest)) throw new BadRequestException("Travel dates must be within about a year.");
    if (dates.some((date, i) => i > 0 && date < dates[i - 1]!)) throw new BadRequestException("Each flight must be on or after the one before it.");
    const routes = criteria.tripType === "multiCity" ? criteria.legs : [{ from: criteria.from, to: criteria.to }];
    if (routes.some((route) => route.from === route.to)) throw new BadRequestException("From and To must be different airports.");
    if (criteria.infants > criteria.adults) throw new BadRequestException("Each infant needs an adult to travel with.");
    if (criteria.adults + criteria.children > 9) throw new BadRequestException("Book up to 9 seated travellers at once.");
  }

  private async callSupplier(criteria: FlightSearchCriteria) {
    const correlationId = randomUUID();
    try {
      return await this.supplier.searchFlights(criteria, { correlationId });
    } catch (error) {
      if (!(error instanceof SupplierError)) throw error;
      this.logger.warn(`${error.supplier} flight search failed (${error.code}, ref ${error.correlationId}): ${error.message}`);
      throw supplierHttpError(error, "Flight search");
    }
  }
}
