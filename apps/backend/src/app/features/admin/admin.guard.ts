import {
  createParamDecorator,
  Injectable,
  UnauthorizedException,
  type CanActivate,
  type ExecutionContext,
} from "@nestjs/common";
import type { Request } from "express";
import { hashToken } from "../auth/session.service.js";
import { AdminsRepository } from "./admins.repository.js";

type AdminRequest = Request & { adminId?: string; adminToken?: string };

export const bearerToken = (request: Request) =>
  request.headers.authorization?.match(/^Bearer (.+)$/)?.[1];

// Requires `Authorization: Bearer <token>` for a live admin session.
// User tokens live in another table, so they never pass.
@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private readonly admins: AdminsRepository) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AdminRequest>();
    const token = bearerToken(request);
    const adminId = token ? await this.admins.resolveToken(hashToken(token)) : null;
    if (!token || !adminId) {
      throw new UnauthorizedException(
        "Your admin session has expired. Please sign in again.",
      );
    }
    request.adminId = adminId;
    request.adminToken = token;
    return true;
  }
}

// The signed-in admin's ID, set by AdminGuard.
export const CurrentAdminId = createParamDecorator(
  (_data: unknown, context: ExecutionContext): string =>
    context.switchToHttp().getRequest<AdminRequest>().adminId!,
);

// The admin's session token, set by AdminGuard (for sign-out).
export const CurrentAdminToken = createParamDecorator(
  (_data: unknown, context: ExecutionContext): string =>
    context.switchToHttp().getRequest<AdminRequest>().adminToken!,
);
