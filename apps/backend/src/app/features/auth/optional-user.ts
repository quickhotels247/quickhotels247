import { Injectable } from "@nestjs/common";
import { SessionService } from "./session.service.js";

// For routes open to guests that do more for signed-in customers (coupons
// with per-customer limits, support requests): the user behind an optional
// "Authorization: Bearer" header, or null.
@Injectable()
export class OptionalUser {
  constructor(private readonly sessions: SessionService) {}

  async from(authorization: string | undefined): Promise<string | null> {
    const token = authorization?.match(/^Bearer (.+)$/)?.[1];
    return token ? this.sessions.resolve(token) : null;
  }
}
