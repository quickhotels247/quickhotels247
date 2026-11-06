import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseUUIDPipe, Put, UseGuards } from "@nestjs/common";
import { AuthGuard, CurrentUserId } from "../../auth/auth.guard.js";
import { SaveHotelDto } from "./dto/save-hotel.dto.js";
import { SavedHotelsService } from "./saved-hotels.service.js";

@Controller("account/saved-hotels")
@UseGuards(AuthGuard)
export class SavedHotelsController {
  constructor(private readonly saved: SavedHotelsService) {}

  @Get()
  list(@CurrentUserId() userId: string) {
    return this.saved.list(userId);
  }

  @Put(":hotelId")
  save(@CurrentUserId() userId: string, @Param("hotelId", new ParseUUIDPipe()) hotelId: string, @Body() dto: SaveHotelDto) {
    return this.saved.save(userId, hotelId, dto);
  }

  @Delete(":hotelId")
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@CurrentUserId() userId: string, @Param("hotelId", new ParseUUIDPipe()) hotelId: string) {
    return this.saved.remove(userId, hotelId);
  }
}
