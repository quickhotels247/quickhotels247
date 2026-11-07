import { randomInt } from "node:crypto";
import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../common/database/prisma.service.js";
import type { CreateTicketDto } from "./dto/create-ticket.dto.js";

const UNIQUE_VIOLATION = "P2002";

@Injectable()
export class SupportRepository {
  constructor(private readonly db: PrismaService) {}

  // A booking with this reference that belongs to the customer (same account
  // or same contact email), so staff see the right one.
  async findBookingFor(reference: string, email: string, userId: string | null): Promise<string | null> {
    const booking = await this.db.booking.findFirst({
      where: { reference, OR: [{ contactEmail: { equals: email, mode: "insensitive" } }, ...(userId ? [{ userId }] : [])] },
      select: { id: true },
    });
    return booking?.id ?? null;
  }

  // Saves the ticket with a short reference ("T-482913"), retrying on a clash.
  async create(dto: CreateTicketDto, userId: string | null, bookingId: string | null): Promise<string> {
    for (let attempt = 0; ; attempt++) {
      const reference = `T-${randomInt(100_000, 1_000_000)}`;
      try {
        await this.db.supportTicket.create({
          data: {
            reference,
            userId,
            bookingId,
            topic: dto.topic,
            name: dto.name,
            email: dto.email,
            phone: dto.phone ?? null,
            bookingReference: dto.bookingReference ?? null,
            message: dto.message,
          },
        });
        return reference;
      } catch (error) {
        if ((error as { code?: string }).code !== UNIQUE_VIOLATION || attempt >= 4) throw error;
      }
    }
  }
}
