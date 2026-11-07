import { Injectable } from "@nestjs/common";
import type { AdminTicket, AdminTicketList, AdminTicketRow, TicketStatus } from "@quickhotels/types/support";
import { PrismaService } from "../../../common/database/prisma.service.js";
import { Prisma } from "../../../../generated/prisma/client.js";

const PAGE_SIZE = 25;
const include = { assignedAdmin: { select: { name: true } } } as const;
type TicketRecord = Prisma.SupportTicketGetPayload<{ include: typeof include }>;

const toRow = (row: TicketRecord): AdminTicketRow => ({
  id: row.id,
  reference: row.reference,
  name: row.name,
  email: row.email,
  topic: row.topic,
  status: row.status as TicketStatus,
  bookingReference: row.bookingReference,
  preview: row.message.replace(/\s+/g, " ").slice(0, 140),
  assignedTo: row.assignedAdmin?.name ?? null,
  createdAt: row.createdAt.toISOString(),
  updatedAt: row.updatedAt.toISOString(),
});

@Injectable()
export class AdminSupportRepository {
  constructor(private readonly db: PrismaService) {}

  async list(status: TicketStatus | undefined, query: string | undefined, page: number): Promise<AdminTicketList> {
    const search: Prisma.SupportTicketWhereInput = query
      ? { OR: ["reference", "email", "name", "bookingReference", "message"].map((field) => ({ [field]: { contains: query, mode: "insensitive" } })) }
      : {};
    const where: Prisma.SupportTicketWhereInput = { ...search, ...(status ? { status } : {}) };
    const [rows, total, grouped] = await Promise.all([
      this.db.supportTicket.findMany({ where, include, orderBy: { updatedAt: "desc" }, skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE }),
      this.db.supportTicket.count({ where }),
      this.db.supportTicket.groupBy({ by: ["status"], where: search, _count: { _all: true } }),
    ]);
    return {
      items: rows.map(toRow),
      total,
      page,
      pageSize: PAGE_SIZE,
      counts: Object.fromEntries(grouped.map((group) => [group.status, group._count._all])),
    };
  }

  async find(id: string): Promise<(AdminTicket & { reference: string }) | null> {
    const row = await this.db.supportTicket.findUnique({
      where: { id },
      include: { ...include, notes: { orderBy: { createdAt: "asc" }, include: { admin: { select: { name: true } } } } },
    });
    if (!row) return null;
    return {
      ...toRow(row),
      phone: row.phone,
      message: row.message,
      userId: row.userId,
      bookingFound: Boolean(row.bookingId),
      notes: row.notes.map((note) => ({
        id: note.id,
        kind: note.kind === "reply" ? "reply" : "note",
        body: note.body,
        adminName: note.admin?.name ?? null,
        createdAt: note.createdAt.toISOString(),
      })),
    };
  }

  async update(id: string, data: { status?: TicketStatus; assignedAdminId?: string | null }): Promise<boolean> {
    const { count } = await this.db.supportTicket.updateMany({ where: { id }, data });
    return count > 0;
  }

  async addNote(ticketId: string, adminId: string, kind: "note" | "reply", body: string): Promise<void> {
    await this.db.$transaction([
      this.db.supportNote.create({ data: { ticketId, adminId, kind, body } }),
      // Touch the ticket so it moves up the list.
      this.db.supportTicket.update({ where: { id: ticketId }, data: { updatedAt: new Date() } }),
    ]);
  }

  async adminName(id: string): Promise<string | null> {
    return (await this.db.adminUser.findUnique({ where: { id }, select: { name: true } }))?.name ?? null;
  }
}
