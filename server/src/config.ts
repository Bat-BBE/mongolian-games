import "dotenv/config";
import { z } from "zod";

function emptyToUndefined(v: unknown): unknown {
  if (v === undefined || v === null) return undefined;
  if (typeof v === "string" && v.trim() === "") return undefined;
  return v;
}

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().url(),
  CORS_ORIGIN: z
    .string()
    .default("http://localhost:3000,http://127.0.0.1:3000"),
  FIREBASE_SERVICE_ACCOUNT_JSON: z.preprocess(
    emptyToUndefined,
    z.string().optional(),
  ),
  FIREBASE_DATABASE_URL: z.preprocess(
    emptyToUndefined,
    z.string().url().optional(),
  ),
  ADMIN_USERNAME: z.preprocess(emptyToUndefined, z.string().min(1).optional()),
  ADMIN_PASSWORD: z.preprocess(emptyToUndefined, z.string().min(1).optional()),
  JWT_SECRET: z.preprocess(emptyToUndefined, z.string().min(32).optional()),
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
