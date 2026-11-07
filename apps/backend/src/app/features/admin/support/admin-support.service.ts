import { Injectable, NotFoundException } from "@nestjs/common";
import type { AdminTicket, AdminTicketList, TicketStatus } from "@quickhotels/types/support";
import { MailService } from "../../../mail/mail.service.js";
import { ticketReplyEmail } from "../../../mail/templates/support.templates.js";
import { AuditLogRepository } from "../audit-log.repository.js";
import { AdminSupportRepository } from "./admin-support.repository.js";
import type { TicketNoteDto, TicketUpdateDto } from "./dto/ticket.dto.js";

// The support inbox: tickets from /help, their status, staff notes and
// replies (emailed to the customer, then kept on the ticket).
@Injectable()
export class AdminSupportService {
  constructor(
    private readonly tickets: AdminSupportRepository,
    private readonly mail: MailService,
    private readonly audit: AuditLogRepository,
  ) {}

  list(status: TicketStatus | undefined, query: string | undefined, page: number): Promise<AdminTicketList> {
    return this.tickets.list(status, query, page);
  }

  async get(id: string): Promise<AdminTicket> {
    const ticket = await this.tickets.find(id);
    if (!ticket) throw new NotFoundException("That request was not found.");
    return ticket;
  }

  async update(id: string, dto: TicketUpdateDto, adminId: string): Promise<AdminTicket> {
    const changes = {
      ...(dto.status ? { status: dto.status } : {}),
      ...(dto.assignToMe === true ? { assignedAdminId: adminId } : dto.assignToMe === false ? { assignedAdminId: null } : {}),
    };
    if (!(await this.tickets.update(id, changes))) throw new NotFoundException("That request was not found.");
    await this.audit.record(adminId, "support.update", id, { ...dto });
    return this.get(id);
  }

  // A reply is emailed first; it's only saved once the email went out.
  async addNote(id: string, dto: TicketNoteDto, adminId: string): Promise<AdminTicket> {
    const ticket = await this.get(id);
    if (dto.kind === "reply") {
      const agent = await this.tickets.adminName(adminId);
      await this.mail.send(ticketReplyEmail(ticket, dto.body, agent ? `${agent}, QuickHotels24/7` : null), { template: "support-reply", userId: ticket.userId });
      if (ticket.status === "OPEN" || ticket.status === "IN_PROGRESS") await this.tickets.update(id, { status: "WAITING_ON_CUSTOMER" });
    }
    await this.tickets.addNote(id, adminId, dto.kind, dto.body);
    await this.audit.record(adminId, dto.kind === "reply" ? "support.reply" : "support.note", id);
    return this.get(id);
  }
}
