import { Controller, Get, Param, ParseUUIDPipe, Query, UseGuards } from "@nestjs/common";
import { AdminUsersService } from "./admin-users.service.js";
import { AdminGuard } from "./admin.guard.js";
import { ListUsersDto } from "./dto/list-users.dto.js";

@Controller("admin/users")
@UseGuards(AdminGuard)
export class AdminUsersController {
  constructor(private readonly users: AdminUsersService) {}

  @Get()
  list(@Query() query: ListUsersDto) {
    return this.users.list(query.search, query.page, query.pageSize);
  }

  @Get(":id")
  detail(@Param("id", new ParseUUIDPipe()) userId: string) {
    return this.users.detail(userId);
  }
}
