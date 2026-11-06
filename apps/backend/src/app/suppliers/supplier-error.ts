import { GatewayTimeoutException, HttpException, ServiceUnavailableException } from "@nestjs/common";

// A supplier call that failed, with a code the rest of the app can act on.
// Messages here are for logs; customers get the safe text from `publicMessage`.
export type SupplierErrorCode =
  | "NOT_CONFIGURED" // missing key, URL or endpoint details
  | "AUTH" // the supplier rejected our credentials
  | "RATE_LIMITED"
  | "TIMEOUT"
  | "UNAVAILABLE" // network error or 5xx
  | "BAD_REQUEST" // the supplier rejected what we sent
  | "BAD_RESPONSE" // we couldn't read what came back
  | "SOLD_OUT"; // the chosen rate is no longer available

export class SupplierError extends Error {
  constructor(
    readonly code: SupplierErrorCode,
    message: string,
    readonly supplier: string,
    readonly correlationId: string,
    readonly httpStatus?: number,
  ) {
    super(message);
    this.name = "SupplierError";
  }

  // Safe text for customers, about `what` failed ("Hotel search", "Room prices").
  publicMessageFor(what: string) {
    return this.code === "TIMEOUT" || this.code === "UNAVAILABLE" || this.code === "RATE_LIMITED"
      ? `${what} is taking longer than usual. Please try again in a moment.`
      : `${what} isn't available right now. Please try again later.`;
  }

  get publicMessage() {
    return this.publicMessageFor("Hotel search");
  }
}

// The HTTP error a customer sees for a failed supplier call: a safe message
// with a short reference to find the full details in the logs.
export function supplierHttpError(error: SupplierError, what = "Hotel search"): HttpException {
  const message = `${error.publicMessageFor(what)} (Reference: ${error.correlationId.slice(0, 8)})`;
  return error.code === "TIMEOUT" ? new GatewayTimeoutException(message) : new ServiceUnavailableException(message);
}
