import { Module } from "@nestjs/common";
import { SuppliersModule } from "../../suppliers/suppliers.module.js";
import { DestinationsController } from "./destinations.controller.js";
import { DestinationsService } from "./destinations.service.js";

@Module({
  imports: [SuppliersModule],
  controllers: [DestinationsController],
  providers: [DestinationsService],
})
export class DestinationsModule {}
