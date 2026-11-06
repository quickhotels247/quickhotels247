import { Controller, Get } from "@nestjs/common";
import { SkipThrottle } from "@nestjs/throttler";
import { AppService } from "./app.service.js";

// Load balancer probes are never rate limited.
@SkipThrottle()
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get("health")
  health() {
    return this.appService.health();
  }
}
