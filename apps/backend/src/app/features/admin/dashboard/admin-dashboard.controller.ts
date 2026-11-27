import { BadRequestException, Controller, Get, Query, UseGuards } from "@nestjs/common";
import type { AdminDashboard } from "@quickhotels/types/admin";
import { AdminGuard, RequirePermission } from "../admin.guard.js";
import { AdminDashboardRepository } from "./admin-dashboard.repository.js";
import { DashboardQueryDto } from "./dto/dashboard-query.dto.js";

const MAX_DAYS = 366;
// Today in India, as YYYY-MM-DD.
const indiaToday = () => new Date(Date.now() + 330 * 60_000).toISOString().slice(0, 10);
const addDays = (day: string, days: number) => new Date(new Date(`${day}T00:00:00Z`).getTime() + days * 86_400_000).toISOString().slice(0, 10);
const valid = (day: string) => !Number.isNaN(new Date(`${day}T00:00:00Z`).getTime()) && new Date(`${day}T00:00:00Z`).toISOString().slice(0, 10) === day;

// Bookings, money and the work queue for the admin home page (spec §5.2).
@Controller("admin/dashboard")
@UseGuards(AdminGuard)
@RequirePermission("bookings")
export class AdminDashboardController {
  constructor(private readonly dashboard: AdminDashboardRepository) {}

  @Get()
  get(@Query() query: DashboardQueryDto): Promise<AdminDashboard> {
    const to = query.to ?? indiaToday();
    const from = query.from ?? addDays(to, -29);
    if (!valid(from) || !valid(to)) throw new BadRequestException("Choose real dates.");
    if (from > to) throw new BadRequestException("The start date must be on or before the end date.");
    if (from < addDays(to, -(MAX_DAYS - 1))) throw new BadRequestException(`Choose at most ${MAX_DAYS} days.`);
    return this.dashboard.dashboard(from, to);
  }
}
