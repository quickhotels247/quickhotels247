import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../common/database/prisma.service.js";
import type { Prisma } from "../../generated/prisma/client.js";

export interface SupplierEventInput {
  supplier: string;
  operation: string; // "search", "pricing", "review", "book", "status", "cancel"
  correlationId: string;
  bookingId?: string;
  httpStatus?: number;
  durationMs: number;
  success: boolean;
  errorCode?: string;
  // Safe metadata only: paths, counts, codes. Never keys, names or contact details.
  requestMeta?: Prisma.InputJsonObject;
  responseMeta?: Prisma.InputJsonObject;
}

// The supplier call log behind the admin Supplier operations page (spec §5.9).
@Injectable()
export class SupplierEventsRepository {
  private readonly logger = new Logger(SupplierEventsRepository.name);

  constructor(private readonly db: PrismaService) {}

  // Logging must never break the call it describes.
  async record(event: SupplierEventInput): Promise<void> {
    try {
      await this.db.supplierEvent.create({ data: event });
    } catch (error) {
      this.logger.warn(`Couldn't log ${event.supplier} ${event.operation}: ${(error as Error).message}`);
    }
  }
}
