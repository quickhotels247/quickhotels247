import { defineConfig } from "prisma/config";

// Prisma CLI settings. Node reads .env itself here (Prisma 7 no longer does);
// a missing .env is fine for `prisma generate`, which needs no database.
try {
  process.loadEnvFile();
} catch {
  // No .env file: rely on the real environment.
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations" },
  // Migrations use the direct (non-pooled) connection; the app uses DATABASE_URL.
  datasource: { url: process.env.DIRECT_URL },
});
