import { randomUUID } from "node:crypto";
import { Inject, Injectable } from "@nestjs/common";
import { SupplierError, type SupplierErrorCode } from "../supplier-error.js";
import { SupplierEventsRepository } from "../supplier-events.repository.js";
import { tripjackConfig, type TripjackConfig } from "./tripjack.config.js";
import { TRIPJACK_ENDPOINTS, type TripjackOperation } from "./tripjack.endpoints.js";
import type { TripjackEnvelope } from "./tripjack.types.js";

const SUPPLIER = "tripjack";

export interface TripjackRequestOptions {
  body?: unknown; // POST only
  query?: Record<string, string | number | undefined>;
  pathSuffix?: string; // e.g. "/TJS2099…" for cancel-booking
  correlationId?: string;
}

// At most this many TripJack calls at once from this server, so background
// work (home prices, content sync) can't crowd out customer searches.
const MAX_IN_FLIGHT = 6;
const RETRY_DELAY_MS = 300;

const codeForStatus = (status: number): SupplierErrorCode =>
  status === 401 || status === 403 ? "AUTH" : status === 429 ? "RATE_LIMITED" : status >= 500 ? "UNAVAILABLE" : "BAD_REQUEST";

// Sends one request to TripJack: adds the apikey header, enforces a timeout,
// retries read-only calls once after a network failure (TripJack's load
// balancer closes idle keep-alive connections, and the next request on one
// fails with "fetch failed"), turns failures (HTTP errors, and
// `status.success: false` inside a 200) into SupplierErrors, and logs the call
// (path, status, timing, error code only) to supplier_events.
@Injectable()
export class TripjackClient {
  private inFlight = 0;
  private readonly waiting: (() => void)[] = [];

  constructor(
    @Inject(tripjackConfig.KEY) private readonly config: TripjackConfig,
    private readonly events: SupplierEventsRepository,
  ) {}

  get configured() {
    return Boolean(this.config.apiKey);
  }

  async request<T extends TripjackEnvelope>(operation: TripjackOperation, options: TripjackRequestOptions = {}): Promise<T> {
    const correlationId = options.correlationId ?? randomUUID();
    const endpoint = TRIPJACK_ENDPOINTS[operation];
    if (!this.config.apiKey) {
      throw new SupplierError("NOT_CONFIGURED", "TRIPJACK_API_KEY is not set.", SUPPLIER, correlationId);
    }

    const base = { hms: this.config.hmsBaseUrl, booker: this.config.bookerBaseUrl, air: this.config.airBaseUrl }[endpoint.host];
    const path = `${endpoint.path}${options.pathSuffix ?? ""}`;
    const query = new URLSearchParams(
      Object.entries(options.query ?? {}).flatMap(([key, value]): [string, string][] => (value === undefined ? [] : [[key, String(value)]])),
    ).toString();
    const url = `${base}${path}${query ? `?${query}` : ""}`;

    const started = Date.now();
    let httpStatus: number | undefined;
    const send = () =>
      fetch(url, {
        method: endpoint.method,
        headers: {
          Accept: "application/json",
          [this.config.authHeader]: this.config.apiKey,
          ...(endpoint.method === "POST" ? { "Content-Type": "application/json" } : {}),
        },
        body: endpoint.method === "POST" ? JSON.stringify(options.body ?? {}) : undefined,
        signal: AbortSignal.timeout("timeoutMs" in endpoint ? endpoint.timeoutMs : this.config.timeoutMs),
      });
    await this.acquire();
    try {
      let response: Response;
      try {
        response = await send();
      } catch (error) {
        // Network failure (not a timeout, not an HTTP error): one retry for reads.
        if (!endpoint.retry || (error as Error).name === "TimeoutError") throw error;
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
        response = await send();
      }
      httpStatus = response.status;
      const text = await response.text();
      let data: T;
      try {
        data = JSON.parse(text) as T;
      } catch {
        throw new SupplierError(
          response.ok ? "BAD_RESPONSE" : codeForStatus(response.status),
          `TripJack ${operation} returned ${response.status} with a non-JSON body`,
          SUPPLIER,
          correlationId,
          response.status,
        );
      }
      // TripJack reports some failures inside an HTTP 200.
      const status = data.status?.httpStatus ?? response.status;
      if (!response.ok || data.status?.success === false) {
        const detail =
          data.errors?.map((error) => `${error.errorType ? `${error.errorType} ` : ""}${error.errCode ?? "?"}: ${error.message ?? ""}`).join("; ") ||
          `HTTP ${status}`;
        // Review answers OPTION_SOLD_OUT when the rate is gone (expected < 1%).
        const code = /SOLD_OUT|sold out/i.test(detail) ? "SOLD_OUT" : codeForStatus(status >= 400 ? status : response.status);
        throw new SupplierError(code, `TripJack ${operation} failed (${detail})`, SUPPLIER, correlationId, status);
      }
      this.log(operation, path, correlationId, started, true, httpStatus);
      return data;
    } catch (caught) {
      const error =
        caught instanceof SupplierError
          ? caught
          : new SupplierError(
              (caught as Error).name === "TimeoutError" ? "TIMEOUT" : "UNAVAILABLE",
              `TripJack ${operation} failed: ${(caught as Error).message}`,
              SUPPLIER,
              correlationId,
            );
      this.log(operation, path, correlationId, started, false, httpStatus, error.code);
      throw error;
    } finally {
      this.release();
    }
  }

  private async acquire() {
    if (this.inFlight < MAX_IN_FLIGHT) {
      this.inFlight++;
      return;
    }
    // The slot is handed over by release(), so inFlight stays the same.
    await new Promise<void>((resolve) => this.waiting.push(resolve));
  }

  private release() {
    const next = this.waiting.shift();
    if (next) next();
    else this.inFlight--;
  }

  // Not awaited: the call log must never slow down or break the call itself
  // (SupplierEventsRepository.record never throws).
  private log(
    operation: string,
    path: string,
    correlationId: string,
    started: number,
    success: boolean,
    httpStatus?: number,
    errorCode?: string,
  ) {
    void this.events.record({
      supplier: SUPPLIER,
      operation,
      correlationId,
      httpStatus,
      durationMs: Date.now() - started,
      success,
      errorCode,
      requestMeta: { path },
    });
  }
}
