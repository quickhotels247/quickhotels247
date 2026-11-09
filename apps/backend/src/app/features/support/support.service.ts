import { Injectable } from "@nestjs/common";
import type { CreateTicketResponse } from "@quickhotels/types/support";
import { frontendUrlFromEnv } from "../auth/auth.config.js";
import { supportInbox } from "../../mail/inbox.js";
import { MailService } from "../../mail/mail.service.js";
import { ticketAlertEmail, ticketReceivedEmail } from "../../mail/templates/support.templates.js";
import type { CreateTicketDto } from "./dto/create-ticket.dto.js";
import { SupportRepository } from "./support.repository.js";


// The /help contact form: a ticket for the team, an acknowledgement for the
// customer, and an alert to the support inbox (both emails in the background).
@Injectable()
export class SupportService {
  constructor(
    private readonly tickets: SupportRepository,
    private readonly mail: MailService,
  ) {}

  async create(dto: CreateTicketDto, userId: string | null): Promise<CreateTicketResponse> {
    const bookingId = dto.bookingReference ? await this.tickets.findBookingFor(dto.bookingReference, dto.email, userId) : null;
    const reference = await this.tickets.create(dto, userId, bookingId);
    const ticket = { reference, name: dto.name, email: dto.email, phone: dto.phone ?? null, topic: dto.topic, bookingReference: dto.bookingReference ?? null, message: dto.message };
    this.mail.sendInBackground(ticketReceivedEmail(ticket), { template: "support-received", userId });
    const inbox = supportInbox();
    if (inbox) this.mail.sendInBackground(ticketAlertEmail(inbox, `${frontendUrlFromEnv()}/admin/support`, ticket), { template: "support-alert" });
    return { reference };
  }
}
