import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../common/database/prisma.service.js";
import type { RegionCandidate, RegionRow as RegionSuggestionRow } from "./tripjack-destinations.js";
import type { CachedHotel, HotelContentRow } from "./tripjack.mapper.js";

const SUPPLIER = "tripjack";

export interface RegionRow {
  regionId: string;
  name: string;
  cityName: string;
  countryName: string;
  regionType: string;
  fullName: string;
}

export interface RegionWithSync extends RegionCandidate {
  hotelsSyncedAt: Date | null;
  hotelCount: number | null;
}

// Our local copy of TripJack's static data: regions, hotels and their content.
// Bulk writes use one INSERT … ON CONFLICT per batch (Prisma's createMany
// can't update existing rows), so syncing thousands of hotels stays fast.
@Injectable()
export class TripjackContentRepository {
  constructor(private readonly db: PrismaService) {}

  countRegions() {
    return this.db.supplierRegion.count({ where: { supplier: SUPPLIER } });
  }

  async upsertRegions(rows: RegionRow[]): Promise<void> {
    if (!rows.length) return;
    await this.db.$executeRaw`
      INSERT INTO supplier_regions (supplier, region_id, name, city_name, country_name, region_type, full_name, updated_at)
      SELECT ${SUPPLIER}, u.region_id, u.name, u.city_name, u.country_name, u.region_type, u.full_name, now()
      FROM unnest(
        ${rows.map((r) => r.regionId)}::text[], ${rows.map((r) => r.name)}::text[], ${rows.map((r) => r.cityName)}::text[],
        ${rows.map((r) => r.countryName)}::text[], ${rows.map((r) => r.regionType)}::text[], ${rows.map((r) => r.fullName)}::text[]
      ) AS u(region_id, name, city_name, country_name, region_type, full_name)
      ON CONFLICT (supplier, region_id) DO UPDATE SET
        name = EXCLUDED.name, city_name = EXCLUDED.city_name, country_name = EXCLUDED.country_name,
        region_type = EXCLUDED.region_type, full_name = EXCLUDED.full_name, updated_at = now()`;
  }

  findRegions(names: string[]): Promise<RegionWithSync[]> {
    return this.db.supplierRegion.findMany({
      where: { supplier: SUPPLIER, OR: [{ name: { in: names } }, { cityName: { in: names } }] },
      select: { regionId: true, name: true, cityName: true, countryName: true, regionType: true, hotelsSyncedAt: true, hotelCount: true },
      take: 50,
    });
  }

  // Regions with a name (or a word of it) starting with `typed`, plus any
  // `exactNames`, best first: places known to have hotels, exact names,
  // names that start with it, more hotels, India, cities, shorter names.
  // A trigram index on lower(name) keeps the word match fast.
  suggestRegions(typed: string, exactNames: string[], limit: number): Promise<RegionSuggestionRow[]> {
    const text = typed.trim().toLowerCase();
    const prefix = `${text.replace(/[\\%_]/g, (char) => `\\${char}`)}%`;
    return this.db.$queryRaw<RegionSuggestionRow[]>`
      SELECT region_id AS "regionId", name, country_name AS "countryName", region_type AS "regionType",
             full_name AS "fullName", hotel_count AS "hotelCount"
      FROM supplier_regions
      WHERE supplier = ${SUPPLIER}
        AND (lower(name) LIKE ${prefix} OR lower(name) LIKE ${`% ${prefix}`} OR name = ANY(${exactNames}::text[]))
      ORDER BY (coalesce(hotel_count, 0) > 0) DESC,
               (lower(name) = ${text} OR name = ANY(${exactNames}::text[])) DESC,
               (lower(name) LIKE ${prefix}) DESC,
               hotel_count DESC NULLS LAST,
               (country_name = 'INDIA') DESC,
               CASE region_type WHEN 'CITY' THEN 0 WHEN 'MULTI_CITY_VICINITY' THEN 1 ELSE 2 END,
               length(name)
      LIMIT ${limit}`;
  }

  // A region's name and country, and the middle (median position) of its
  // hotels, for measuring distances when there's no landmark.
  async regionPlace(regionId: string): Promise<{ name: string; countryName: string; lat: number | null; lng: number | null } | null> {
    const [row] = await this.db.$queryRaw<{ name: string; countryName: string; lat: number | null; lng: number | null }[]>`
      SELECT r.name, r.country_name AS "countryName",
             (SELECT percentile_cont(0.5) WITHIN GROUP (ORDER BY h.latitude) FROM hotels h
               WHERE h.supplier = r.supplier AND h.region_id = r.region_id AND h.latitude IS NOT NULL)::float8 AS lat,
             (SELECT percentile_cont(0.5) WITHIN GROUP (ORDER BY h.longitude) FROM hotels h
               WHERE h.supplier = r.supplier AND h.region_id = r.region_id AND h.longitude IS NOT NULL)::float8 AS lng
      FROM supplier_regions r
      WHERE r.supplier = ${SUPPLIER} AND r.region_id = ${regionId}
      LIMIT 1`;
    return row ?? null;
  }

  async markRegionSynced(regionId: string, hotelCount: number) {
    await this.db.supplierRegion.update({
      where: { supplier_regionId: { supplier: SUPPLIER, regionId } },
      data: { hotelsSyncedAt: new Date(), hotelCount },
    });
  }

  async setRegionHotelCount(regionId: string, hotelCount: number) {
    await this.db.supplierRegion.update({
      where: { supplier_regionId: { supplier: SUPPLIER, regionId } },
      data: { hotelCount },
    });
  }

  async upsertHotels(rows: HotelContentRow[]): Promise<void> {
    if (!rows.length) return;
    const col = <K extends keyof HotelContentRow>(key: K) => rows.map((row) => row[key]);
    await this.db.$executeRaw`
      INSERT INTO hotels (supplier, supplier_hotel_id, region_id, name, address, city, country, latitude, longitude,
                          star_rating, property_type, is_active, hero_image_url, content_updated_at, updated_at)
      SELECT ${SUPPLIER}, u.*, now(), now()
      FROM unnest(
        ${col("supplierHotelId")}::text[], ${col("regionId")}::text[], ${col("name")}::text[], ${col("address")}::text[],
        ${col("city")}::text[], ${col("country")}::text[], ${col("latitude")}::numeric[], ${col("longitude")}::numeric[],
        ${col("starRating")}::numeric[], ${col("propertyType")}::text[], ${col("isActive")}::boolean[], ${col("heroImageUrl")}::text[]
      ) AS u
      ON CONFLICT (supplier, supplier_hotel_id) DO UPDATE SET
        region_id = COALESCE(hotels.region_id, EXCLUDED.region_id), name = EXCLUDED.name, address = EXCLUDED.address,
        city = EXCLUDED.city, country = EXCLUDED.country, latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude,
        star_rating = EXCLUDED.star_rating, property_type = EXCLUDED.property_type, is_active = EXCLUDED.is_active,
        hero_image_url = EXCLUDED.hero_image_url, content_updated_at = now(), updated_at = now()`;
    await this.db.$executeRaw`
      INSERT INTO hotel_content_cache (hotel_id, language, description, facilities, images, fetched_at)
      SELECT h.id, 'en', u.description, u.facilities::jsonb, u.images::jsonb, now()
      FROM unnest(
        ${col("supplierHotelId")}::text[], ${col("description")}::text[],
        ${rows.map((r) => JSON.stringify(r.facilities))}::text[], ${rows.map((r) => JSON.stringify(r.images))}::text[]
      ) AS u(supplier_hotel_id, description, facilities, images)
      JOIN hotels h ON h.supplier = ${SUPPLIER} AND h.supplier_hotel_id = u.supplier_hotel_id
      ON CONFLICT (hotel_id, language) DO UPDATE SET
        description = EXCLUDED.description, facilities = EXCLUDED.facilities, images = EXCLUDED.images, fetched_at = now()`;
  }

  // The region's active hotels to search, best-rated first; `offset` skips
  // the ones earlier pages already priced.
  async hotelsForRegion(regionId: string, limit: number, offset = 0): Promise<CachedHotel[]> {
    const rows = await this.db.hotel.findMany({
      where: { supplier: SUPPLIER, regionId, isActive: true },
      orderBy: [{ starRating: { sort: "desc", nulls: "last" } }, { name: "asc" }, { id: "asc" }],
      skip: offset,
      take: limit,
      select: {
        id: true, supplierHotelId: true, name: true, city: true, country: true,
        address: true, starRating: true, propertyType: true, heroImageUrl: true, latitude: true, longitude: true,
        content: { select: { facilities: true }, take: 1 },
      },
    });
    return rows.map(({ content, ...row }) => ({
      ...row,
      starRating: row.starRating === null ? null : Number(row.starRating),
      latitude: row.latitude === null ? null : Number(row.latitude),
      longitude: row.longitude === null ? null : Number(row.longitude),
      facilities: Array.isArray(content[0]?.facilities) ? (content[0].facilities as unknown[]).filter((name): name is string => typeof name === "string") : [],
    }));
  }
}
