import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { AdminGuard, RequirePermission, CurrentAdminId } from "../admin.guard.js";
import { AdminSupportService } from "./admin-support.service.js";
import { TicketListQueryDto, TicketNoteDto, TicketUpdateDto } from "./dto/ticket.dto.js";

@Controller("admin/support/tickets")
@UseGuards(AdminGuard)
@RequirePermission("support")
export class AdminSupportController {
  constructor(private readonly support: AdminSupportService) {}

  @Get()
  list(@Query() query: TicketListQueryDto) {
    return this.support.list(query.status, query.q || undefined, query.page);
  }

  @Get(":id")
  get(@Param("id", new ParseUUIDPipe()) id: string) {
    return this.support.get(id);
  }

  @Patch(":id")
  update(@Param("id", new ParseUUIDPipe()) id: string, @Body() dto: TicketUpdateDto, @CurrentAdminId() adminId: string) {
    return this.support.update(id, dto, adminId);
  }

  @Post(":id/notes")
  addNote(@Param("id", new ParseUUIDPipe()) id: string, @Body() dto: TicketNoteDto, @CurrentAdminId() adminId: string) {
    return this.support.addNote(id, dto, adminId);
  }
}
