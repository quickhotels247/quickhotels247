import { registerAs } from "@nestjs/config";

export interface AppConfig {
  port: number;
  corsOrigins: string[];
  // Express "trust proxy": the number of proxies in front, or false.
  trustProxy: number | false;
}

export const appConfig = registerAs("app", (): AppConfig => ({
  port: Number(process.env.PORT ?? 8080),
  corsOrigins: (process.env.CORS_ORIGINS ?? "http://localhost:3000")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
  trustProxy: Number(process.env.TRUST_PROXY) > 0 ? Number(process.env.TRUST_PROXY) : false,
}));
