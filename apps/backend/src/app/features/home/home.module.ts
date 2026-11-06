import { Module } from "@nestjs/common";
import { SuppliersModule } from "../../suppliers/suppliers.module.js";
import { HomeController } from "./home.controller.js";
import { HomeService } from "./home.service.js";

@Module({
  imports: [SuppliersModule],
  controllers: [HomeController],
  providers: [HomeService],
})
export class HomeModule {}
