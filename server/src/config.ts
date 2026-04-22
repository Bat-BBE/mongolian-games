import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().url(),
  /** Comma-separated. Dev-д хоёр браузер `localhost` vs `127.0.0.1`-ээр нээвэл нэг нь CORS-оор бүтэхгүй — хоёуланг нь оруулна. */
  CORS_ORIGIN: z
    .string()
    .default("http://localhost:3000,http://127.0.0.1:3000"),
  FIREBASE_SERVICE_ACCOUNT_JSON: z.string().optional(),
  FIREBASE_DATABASE_URL: z.string().url().optional(),
  ADMIN_USERNAME: z.string().min(1).optional(),
  ADMIN_PASSWORD: z.string().min(1).optional(),
  JWT_SECRET: z.string().min(32).optional(),
});

export type Env = z.infer<typeof envSchema>;

function loadEnv(): Env {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const msg = parsed.error.flatten().fieldErrors;
    throw new Error(`Invalid server environment: ${JSON.stringify(msg)}`);
  }
  return parsed.data;
}

export const env = loadEnv();
