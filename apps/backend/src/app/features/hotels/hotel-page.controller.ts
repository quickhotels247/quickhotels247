import { Controller, Get, Param, ParseUUIDPipe, Query } from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import { defaultSearchStay } from "../../common/config/stay-defaults.js";
import { LIMITS } from "../../common/throttle/limits.js";
import { HotelRoomsQueryDto } from "./dto/hotel-rooms-query.dto.js";
import { HotelPageService } from "./hotel-page.service.js";

// The hotel page, under /api/v1/hotels. Public, like search.
@Controller("v1/hotels")
export class HotelPageController {
  constructor(private readonly hotelPage: HotelPageService) {}

  // Content: photos, description, facilities, policies, room types.
  @Get(":id")
  details(@Param("id", new ParseUUIDPipe()) id: string) {
    return this.hotelPage.details(id);
  }

  // Live rooms and rates: ?checkIn&checkOut&rooms&adults&children&childAges&searchId
  @Get(":id/rooms")
  @Throttle(LIMITS.search)
  rooms(@Param("id", new ParseUUIDPipe()) id: string, @Query() query: HotelRoomsQueryDto) {
    const { checkIn, checkOut } = query.checkIn && query.checkOut ? { checkIn: query.checkIn, checkOut: query.checkOut } : defaultSearchStay();
    const { rooms, adults, children, childAges, searchId } = query;
    return this.hotelPage.rooms(id, { destination: "", checkIn, checkOut, rooms, adults, children, ...(childAges?.length ? { childAges } : {}) }, searchId);
  }
}
