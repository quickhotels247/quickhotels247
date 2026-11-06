import {
  createParamDecorator,
  Injectable,
  Logger,
  UnauthorizedException,
  type CanActivate,
  type ExecutionContext,
} from "@nestjs/common";
import type { Request } from "express";
import { SessionService } from "./session.service.js";

type AuthedRequest = Request & { userId?: string; sessionToken?: string };

// Requires `Authorization: Bearer <token>` for a live QuickHotels24/7 session.
@Injectable()
export class AuthGuard implements CanActivate {
  private readonly logger = new Logger(AuthGuard.name);

  constructor(private readonly sessions: SessionService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthedRequest>();
    const token = request.headers.authorization?.match(/^Bearer (.+)$/)?.[1];
    const userId = token ? await this.sessions.resolve(token) : null;
    if (!token || !userId) {
      if (request.path === "/account") {
        this.logger.warn(
          `GET /account rejected: ${token ? "token invalid, expired, or revoked" : "Bearer token missing"}`,
        );
      }
      throw new UnauthorizedException(
        "Your session has expired. Please log in again.",
      );
    }
    if (request.path === "/account") this.logger.log("GET /account authorized");
    request.userId = userId;
    request.sessionToken = token;
    return true;
  }
}

// The signed-in user's ID, set by AuthGuard.
export const CurrentUserId = createParamDecorator(
  (_data: unknown, context: ExecutionContext): string =>
    context.switchToHttp().getRequest<AuthedRequest>().userId!,
);

// The caller's session token, set by AuthGuard (e.g. to keep this session
// when signing out everywhere else).
export const CurrentSessionToken = createParamDecorator(
  (_data: unknown, context: ExecutionContext): string =>
    context.switchToHttp().getRequest<AuthedRequest>().sessionToken!,
);
