import { Controller, Get } from "@nestjs/common";
import { PopularRoutesService } from "./popular-routes.service.js";

// Cheapest recent round-trip fares for the flights page, under /api/v1/flights/popular-routes.
@Controller("v1/flights/popular-routes")
export class PopularRoutesController {
  constructor(private readonly popular: PopularRoutesService) {}

  // Served from memory; fares refresh in the background.
  @Get()
  fares() {
    return this.popular.fares();
  }
}
