// config/database.config.ts
import { registerAs } from "@nestjs/config";
import { z } from "zod";

const envSchema = z.object({
  jwtSecret: z.string(),
  jwtExpirationMinutes: z.number(),
  refreshTokenExpirationMinutes: z.number(),
  emailHost: z.string(),
  emailPort: z.number(),
  emailUser: z.string(),
  emailPass: z.string(),
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
    emailHost: process.env.EMAIL_HOST,
    emailPort: parseInt(process.env.EMAIL_PORT || "465", 10),
    emailUser: process.env.EMAIL_USER,
    emailPass: process.env.EMAIL_PASS,
    databaseUrl: process.env.DATABASE_URL,
    nodeEnv: process.env.NODE_ENV,
  };

  return envSchema.parse(env);
});

export type EnvConfig = z.infer<typeof envSchema>;
