import { Injectable, Logger } from "@nestjs/common";
import type { CompanyGst, CompanyGstSetting } from "@quickhotels/types/admin";
import { PrismaService } from "../common/database/prisma.service.js";

const GST_KEY = "company.gst";
const MARGIN_GST_KEY = "pricing.margin_gst_percent";
// GST on our margin (agent model) when no admin has changed it.
export const DEFAULT_MARGIN_GST_PERCENT = 18;
const CACHE_MS = 60_000;

// Business settings kept in the database and edited by admins (Admin →
// Settings). Read often while booking, so cached briefly; a save refreshes it.
@Injectable()
export class CompanySettingsService {
  private readonly logger = new Logger(CompanySettingsService.name);
  private cached: { value: CompanyGstSetting; at: number } | null = null;
  private marginGstCache: { percent: number; at: number } | null = null;

  constructor(private readonly db: PrismaService) {}

  async gstSetting(): Promise<CompanyGstSetting> {
    if (this.cached && Date.now() - this.cached.at < CACHE_MS) return this.cached.value;
    const row = await this.db.appSetting.findUnique({ where: { key: GST_KEY } });
    const value = row ? { gst: row.value as unknown as CompanyGst, updatedAt: row.updatedAt.toISOString() } : { gst: null, updatedAt: null };
    this.cached = { value, at: Date.now() };
    return value;
  }

  // Our GST details, or null when no admin has set them. Used after payment,
  // so a failed read never stops a booking (TripJack decides without it).
  async gst(): Promise<CompanyGst | null> {
    try {
      return (await this.gstSetting()).gst;
    } catch (error) {
      this.logger.error(`Couldn't read the company GST setting: ${(error as Error).message}`);
      return null;
    }
  }

  async saveGst(gst: CompanyGst, adminId: string): Promise<CompanyGstSetting> {
    const value = { gstNumber: gst.gstNumber, registeredName: gst.registeredName };
    await this.db.appSetting.upsert({
      where: { key: GST_KEY },
      create: { key: GST_KEY, value, updatedBy: adminId },
      update: { value, updatedBy: adminId },
    });
    this.cached = null;
    return this.gstSetting();
  }

  // GST charged on our hotel margin, in percent (0 turns it off). Read while
  // pricing, so cached; a failed read keeps the last value or the default.
  async marginGstPercent(): Promise<number> {
    if (this.marginGstCache && Date.now() - this.marginGstCache.at < CACHE_MS) return this.marginGstCache.percent;
    try {
      const row = await this.db.appSetting.findUnique({ where: { key: MARGIN_GST_KEY } });
      const percent = row ? Number((row.value as { percent?: number }).percent ?? DEFAULT_MARGIN_GST_PERCENT) : DEFAULT_MARGIN_GST_PERCENT;
      this.marginGstCache = { percent, at: Date.now() };
    } catch (error) {
      this.logger.error(`Couldn't read the margin GST setting: ${(error as Error).message}`);
      if (!this.marginGstCache) return DEFAULT_MARGIN_GST_PERCENT;
    }
    return this.marginGstCache!.percent;
  }

  async saveMarginGstPercent(percent: number, adminId: string): Promise<number> {
    await this.db.appSetting.upsert({
      where: { key: MARGIN_GST_KEY },
      create: { key: MARGIN_GST_KEY, value: { percent }, updatedBy: adminId },
      update: { value: { percent }, updatedBy: adminId },
    });
    this.marginGstCache = null;
    return this.marginGstPercent();
  }

  async clearGst(): Promise<CompanyGstSetting> {
    await this.db.appSetting.deleteMany({ where: { key: GST_KEY } });
    this.cached = null;
    return this.gstSetting();
  }
}
