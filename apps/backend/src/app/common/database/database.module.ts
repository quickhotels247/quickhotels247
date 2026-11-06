import { Global, Module } from "@nestjs/common";
import { CleanupService } from "./cleanup.service.js";
import { PrismaService } from "./prisma.service.js";

// Gives every module the Prisma client (PrismaService).
@Global()
@Module({
  providers: [PrismaService, CleanupService],
  exports: [PrismaService],
})
export class DatabaseModule {}
