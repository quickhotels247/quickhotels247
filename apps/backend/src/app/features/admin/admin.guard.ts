import {
  createParamDecorator,
  ForbiddenException,
  Injectable,
  SetMetadata,
  UnauthorizedException,
  type CanActivate,
  type ExecutionContext,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import type { Request } from "express";
import type { AdminPermission, AdminRole } from "@quickhotels/types/admin";
import { can } from "./admin-permissions.js";
import { hashToken } from "../auth/session.service.js";
import { AdminsRepository } from "./admins.repository.js";

type AdminRequest = Request & { adminId?: string; adminToken?: string; adminRole?: AdminRole };

const PERMISSION = "admin:permission";
// Marks a controller or route as needing a permission (see admin-permissions).
export const RequirePermission = (permission: AdminPermission) => SetMetadata(PERMISSION, permission);

export const bearerToken = (request: Request) =>
  request.headers.authorization?.match(/^Bearer (.+)$/)?.[1];

// Requires `Authorization: Bearer <token>` for a live admin session, and the
// route's permission (@RequirePermission) for the admin's current role.
// User tokens live in another table, so they never pass.
@Injectable()
export class AdminGuard implements CanActivate {
  constructor(
    private readonly admins: AdminsRepository,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AdminRequest>();
    const token = bearerToken(request);
    const session = token ? await this.admins.resolveToken(hashToken(token)) : null;
    if (!token || !session) {
      throw new UnauthorizedException(
        "Your admin session has expired. Please sign in again.",
      );
    }
    const needed = this.reflector.getAllAndOverride<AdminPermission | undefined>(PERMISSION, [context.getHandler(), context.getClass()]);
    if (needed && !can(session.role, needed)) {
      throw new ForbiddenException("Your admin role doesn't include this. Ask a super admin if you need it.");
    }
    request.adminId = session.adminId;
    request.adminToken = token;
    request.adminRole = session.role;
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
