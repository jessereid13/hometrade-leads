import "dotenv/config";
import { defineConfig } from "prisma/config";

// DATABASE_URL is only needed for migrate/push/seed; `prisma generate` runs
// on install without it, so fall back to a placeholder there.
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations", seed: "tsx prisma/seed.ts" },
  datasource: { url: process.env.DATABASE_URL ?? "postgresql://localhost:5432/unset" },
});
