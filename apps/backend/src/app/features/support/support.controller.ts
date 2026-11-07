import { Body, Controller, Headers, Post } from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import { LIMITS } from "../../common/throttle/limits.js";
import { SessionService } from "../auth/session.service.js";
import { CreateTicketDto } from "./dto/create-ticket.dto.js";
import { SupportService } from "./support.service.js";

@Controller("v1/support")
export class SupportController {
  constructor(
    private readonly support: SupportService,
    private readonly sessions: SessionService,
  ) {}

  // Open to guests; a signed-in customer's ticket is linked to their account.
  @Throttle(LIMITS.sendEmail)
  @Post("tickets")
  async create(@Body() dto: CreateTicketDto, @Headers("authorization") authorization?: string) {
    const token = authorization?.match(/^Bearer (.+)$/)?.[1];
    const userId = token ? await this.sessions.resolve(token) : null;
    return this.support.create(dto, userId);
  }
}
