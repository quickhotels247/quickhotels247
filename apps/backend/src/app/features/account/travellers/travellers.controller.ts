import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseUUIDPipe, Post, Put, UseGuards } from "@nestjs/common";
import { AuthGuard, CurrentUserId } from "../../auth/auth.guard.js";
import { SavedTravellerDto } from "./dto/saved-traveller.dto.js";
import { TravellersService } from "./travellers.service.js";

@Controller("account/travellers")
@UseGuards(AuthGuard)
export class TravellersController {
  constructor(private readonly travellers: TravellersService) {}

  @Get()
  list(@CurrentUserId() userId: string) {
    return this.travellers.list(userId);
  }

  @Post()
  create(@CurrentUserId() userId: string, @Body() dto: SavedTravellerDto) {
    return this.travellers.create(userId, dto);
  }

  @Put(":id")
  update(@CurrentUserId() userId: string, @Param("id", new ParseUUIDPipe()) id: string, @Body() dto: SavedTravellerDto) {
    return this.travellers.update(userId, id, dto);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@CurrentUserId() userId: string, @Param("id", new ParseUUIDPipe()) id: string) {
    return this.travellers.remove(userId, id);
  }
}
