// config/database.config.ts
import { registerAs } from "@nestjs/config";
import { z } from "zod";

const envSchema = z.object({
  jwtSecret: z.string(),
  jwtExpirationMinutes: z.number(),
  refreshTokenExpirationMinutes: z.number(),
  smtpHost: z.string(),
  smtpPort: z.number(),
  smtpUser: z.string(),
  smtpPass: z.string(),
  smtpFrom: z.string(),
  databaseUrl: z.string(),
  nodeEnv: z.enum(["development", "production"]),
});

export const envConfig = registerAs("env", () => {
  const env = {
    jwtSecret: process.env.JWT_SECRET,
    jwtExpirationMinutes: parseInt(
      process.env.JWT_EXPIRATION_MINUTES || "15",
      10,
    ),
    refreshTokenExpirationMinutes: parseInt(
      process.env.REFRESH_TOKEN_EXPIRATION_MINUTES || "10080",
      10,
    ),
    smtpHost: process.env.SMTP_HOST,
    smtpPort: parseInt(process.env.SMTP_PORT || "465", 10),
    smtpUser: process.env.SMTP_USER,
    smtpPass: process.env.SMTP_PASS,
    smtpFrom: process.env.SMTP_FROM,
    databaseUrl: process.env.DATABASE_URL,
    nodeEnv: process.env.NODE_ENV,
  };

  return envSchema.parse(env);
});

export type EnvConfig = z.infer<typeof envSchema>;
