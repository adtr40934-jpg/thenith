import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  APP_URL: z.preprocess(
    (value) => (typeof value === "string" ? value.trim() : value),
    z.string().default(""),
  ),
  CLIENT_ORIGIN: z.preprocess(
    (value) => (typeof value === "string" ? value.trim() : value),
    z.string().default(""),
  ),
  MONGODB_URI: z.string().min(1),
  MONGODB_DNS_SERVERS: z.string().default(""),
  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  ADMIN_JWT_SECRET: z.string().min(16),
  ACCESS_TOKEN_TTL: z.string().default("15m"),
  REFRESH_TOKEN_TTL: z.string().default("30d"),
  COOKIE_SECURE: z
    .string()
    .transform((value) => value === "true")
    .default("false"),
  SMTP_HOST: z.string().default(""),
  SMTP_PORT: z.coerce.number().int().positive().default(587),
  SMTP_SECURE: z
    .string()
    .transform((value) => value === "true")
    .default("false"),
  SMTP_USER: z.string().default(""),
  SMTP_PASSWORD: z.string().default(""),
  MAIL_FROM: z.string().default("Thenith <no-reply@thenith.com>"),
  CLOUDINARY_CLOUD_NAME: z.string().default(""),
  CLOUDINARY_API_KEY: z.string().default(""),
  CLOUDINARY_API_SECRET: z.string().default(""),
  // Google OAuth
  GOOGLE_CLIENT_ID: z.string().default(""),
  // Fawaterak Payment Gateway
  FAWATERAK_ENV: z.enum(["test", "live"]).default("test"),
  FAWATERAK_CLIENT_ID: z.string().default(""),
  FAWATERAK_CLIENT_SECRET: z.string().default(""),
  FAWATERAK_API_KEY: z.string().default(""),
  FAWATERAK_BASE_URL: z.string().default("https://staging.fawaterk.com"),
  // Socket.IO
  SOCKET_PING_TIMEOUT: z.coerce.number().int().positive().default(60000),
  SOCKET_PING_INTERVAL: z.coerce.number().int().positive().default(25000),
  SOCKET_MAX_HTTP_BUFFER_SIZE: z.coerce
    .number()
    .int()
    .positive()
    .default(1000000),
  SOCKET_PATH: z.string().default("/socket.io"),
  AVATAR_API_URL: z.string().default("https://api.dicebear.com/9.x/avataaars/svg?seed="),
});

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  console.error(
    "Invalid environment configuration:",
    parsed.error.flatten().fieldErrors,
  );
  process.exit(1);
}

const env = parsed.data;
if (
  env.NODE_ENV === "production" &&
  [env.JWT_ACCESS_SECRET, env.JWT_REFRESH_SECRET].some((secret) =>
    secret.startsWith("replace-with-"),
  )
) {
  process.exit(1);
}
const clientOrigins = (env.CLIENT_ORIGIN || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

export default {
  env,
  clientOrigins,
};
