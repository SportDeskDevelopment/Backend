import {
  ConflictException,
  Inject,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";
import { EnvConfig, envConfig } from "../config/config.env";
import { EmailService } from "../email/email.service";
import { PrismaService } from "../prisma/prisma.service";
import { AuthDto } from "./dto";
import { RefreshDto } from "./dto/refresh.dto";
import { addMinutes } from "../shared/lib/date";
import { JwtPayload } from "../common/types/jwt-payload";
import * as DB from "@prisma/client";
import { UserId } from "src/kernel/ids";

@Injectable()
export class AuthService {
  constructor(
    private readonly db: PrismaService,
    private readonly jwtService: JwtService,
    private readonly emailService: EmailService,
    @Inject(envConfig.KEY)
    private readonly config: EnvConfig,
  ) {}

  async register(dto: AuthDto.RegisterRequest) {
    const isUserExists = await this.db.user.findUnique({
      where: { email: dto.email },
    });

    if (isUserExists) {
      throw new ConflictException("Email already exists");
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const emailConfirmCode = this.generateRandomCode(6);

    await this.emailService.sendConfirmationEmail(dto.email, emailConfirmCode);

    // create trainee profile by default and set active role to trainee
    await this.db.user.create({
      data: {
        email: dto.email,
        passwordHash,
        name: dto.name,
        emailConfirmCode,
        activeRole: DB.RoleType.TRAINEE,
        roles: [DB.RoleType.TRAINEE],
        traineeProfile: {
          create: {},
        },
      },
    });

    return { message: "Confirmation code sent to your email" };
  }

  async confirmEmail(
    dto: AuthDto.ConfirmEmailRequest,
    info: { ip?: string; userAgent?: string } = {},
  ) {
    const user = await this.db.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      throw new UnauthorizedException("User not found");
    }

    if (user.emailConfirmCode !== dto.code) {
      throw new UnauthorizedException("Invalid confirmation code");
    }

    const updatedUser = await this.db.user.update({
      where: { id: user.id },
      data: {
        isEmailConfirmed: true,
        emailConfirmCode: null,
      },
    });

    const tokens = await this.generateTokens({
      id: updatedUser.id as UserId,
      email: updatedUser.email,
      preferredLang: updatedUser.preferredLang,
      roles: updatedUser.roles,
    });

    await this.createRefreshSession({
      userId: user.id,
      refreshToken: tokens.refreshToken,
      ip: info.ip,
      userAgent: info.userAgent,
    });

    return {
      message: "Email confirmed successfully",
      tokens,
    };
  }

  async login(
    dto: AuthDto.LoginRequest,
    info: { ip?: string; userAgent?: string } = {},
  ) {
    const user = await this.db.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      throw new UnauthorizedException("Invalid credentials");
    }

    const isPasswordValid = await bcrypt.compare(
      dto.password,
      user.passwordHash,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException("Invalid credentials");
    }

    const tokens = await this.generateTokens({
      id: user.id as UserId,
      email: user.email,
      preferredLang: user.preferredLang,
      roles: user.roles,
    });

    await this.createRefreshSession({
      userId: user.id,
      refreshToken: tokens.refreshToken,
      ip: info.ip,
      userAgent: info.userAgent,
    });

    return tokens;
  }

  async refresh(dto: RefreshDto) {
    const session = await this.db.refreshSession.findFirst({
      where: {
        tokenHash: await bcrypt.hash(dto.refreshToken, 10),
        isRevoked: false,
        expiresAt: { gt: new Date() },
      },
    });

    if (!session) {
      throw new UnauthorizedException("Invalid refresh token");
    }

    const user = await this.db.user.findUnique({
      where: { id: session.userId },
    });

    if (!user) {
      throw new UnauthorizedException("User not found");
    }

    const tokens = await this.generateTokens({
      id: user.id as UserId,
      email: user.email,
      preferredLang: user.preferredLang,
      roles: user.roles,
    });
    await this.updateRefreshSession(session.id, tokens.refreshToken);

    return tokens;
  }

  async logout(refreshToken: string) {
    const session = await this.db.refreshSession.findFirst({
      where: {
        tokenHash: await bcrypt.hash(refreshToken, 10),
        isRevoked: false,
      },
    });

    if (!session) {
      throw new UnauthorizedException("Invalid refresh token");
    }

    await this.db.refreshSession.update({
      where: { id: session.id },
      data: { isRevoked: true },
    });
  }

  async logoutAll(userId: string) {
    await this.db.refreshSession.updateMany({
      where: { userId, isRevoked: false },
      data: { isRevoked: true },
    });
  }

  private async createRefreshSession(data: {
    userId: string;
    refreshToken: string;
    ip: string;
    userAgent: string;
  }) {
    const tokenHash = await bcrypt.hash(data.refreshToken, 10);
    const expiresAt = addMinutes(
      new Date(),
      this.config.refreshTokenExpirationMinutes,
    );

    await this.db.refreshSession.create({
      data: {
        userId: data.userId,
        tokenHash,
        ip: data.ip,
        userAgent: data.userAgent,
        expiresAt,
      },
    });
  }

  private async updateRefreshSession(sessionId: string, refreshToken: string) {
    const tokenHash = await bcrypt.hash(refreshToken, 10);
    const expiresAt = addMinutes(
      new Date(),
      this.config.refreshTokenExpirationMinutes,
    );

    await this.db.refreshSession.update({
      where: { id: sessionId },
      data: { tokenHash, expiresAt },
    });
  }

  private async generateTokens(payload: JwtPayload) {
    const accessToken = await this.jwtService.signAsync(payload, {
      expiresIn: this.config.jwtExpirationMinutes + "m",
    });
    const refreshToken = crypto.randomUUID();
    return { accessToken, refreshToken };
  }

  private generateRandomCode(length: number) {
    return Math.floor(
      10 ** (length - 1) +
        Math.random() * (10 ** length - 10 ** (length - 1) - 1),
    ).toString();
  }
}
