import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { JwtModule } from "@nestjs/jwt";
import { envConfig, EnvConfig } from "../config/config.env";
import { EmailModule } from "../email/email.module";
import { PrismaService } from "../prisma/prisma.service";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { JwtStrategy } from "./strategies/jwt.strategy";

@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (envConfig: EnvConfig) => ({
        secret: envConfig.jwtSecret,
        signOptions: { expiresIn: envConfig.jwtExpirationMinutes + "m" },
      }),
      inject: [envConfig.KEY],
    }),
    EmailModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, PrismaService, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}
