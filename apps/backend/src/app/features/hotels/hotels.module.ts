import { Module } from "@nestjs/common";
import { SuppliersModule } from "../../suppliers/suppliers.module.js";
import { HotelPageController } from "./hotel-page.controller.js";
import { HotelPageRepository } from "./hotel-page.repository.js";
import { HotelPageService } from "./hotel-page.service.js";
import { HotelsController } from "./hotels.controller.js";
import { HotelsService } from "./hotels.service.js";
import { SearchSessionsRepository } from "./search-sessions.repository.js";

@Module({
  imports: [SuppliersModule],
  controllers: [HotelsController, HotelPageController],
  providers: [HotelsService, SearchSessionsRepository, HotelPageService, HotelPageRepository],
  // Checkout reads rooms sessions and hotel content.
  exports: [SearchSessionsRepository, HotelPageRepository],
})
export class HotelsModule {}
