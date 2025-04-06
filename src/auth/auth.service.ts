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

@Injectable()
export class AuthService {
  // private googleClient: OAuth2Client;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly emailService: EmailService,
    @Inject(envConfig.KEY)
    private readonly config: EnvConfig,
  ) {
    // this.googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
  }

  async register(dto: AuthDto.RegisterRequest) {
    const isUserExists = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (isUserExists) {
      throw new ConflictException("Email already exists");
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const emailConfirmCode = this.generateRandomCode(6);

    await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        name: dto.name,
        emailConfirmCode,
      },
    });

    await this.emailService.sendConfirmationEmail(dto.email, emailConfirmCode);

    return { message: "Confirmation code sent to your email" };
  }

  async confirmEmail(dto: AuthDto.ConfirmEmailRequest) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      throw new UnauthorizedException("User not found");
    }

    if (user.emailConfirmCode !== dto.code) {
      throw new UnauthorizedException("Invalid confirmation code");
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        isEmailConfirmed: true,
        emailConfirmCode: null,
      },
    });

    return { message: "Email confirmed successfully" };
  }

  async login(
    dto: AuthDto.LoginRequest,
    info: { ip?: string; userAgent?: string } = {},
  ) {
    const user = await this.prisma.user.findUnique({
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

    const tokens = await this.generateTokens(user.id);

    await this.createRefreshSession({
      userId: user.id,
      refreshToken: tokens.refreshToken,
      ip: info.ip,
      userAgent: info.userAgent,
    });

    return tokens;
  }

  async refresh(dto: RefreshDto) {
    const session = await this.prisma.refreshSession.findFirst({
      where: {
        tokenHash: await bcrypt.hash(dto.refreshToken, 10),
        isRevoked: false,
        expiresAt: { gt: new Date() },
      },
    });

    if (!session) {
      throw new UnauthorizedException("Invalid refresh token");
    }

    const tokens = await this.generateTokens(session.userId);
    await this.updateRefreshSession(session.id, tokens.refreshToken);

    return tokens;
  }

  async logout(refreshToken: string) {
    const session = await this.prisma.refreshSession.findFirst({
      where: {
        tokenHash: await bcrypt.hash(refreshToken, 10),
        isRevoked: false,
      },
    });

    if (!session) {
      throw new UnauthorizedException("Invalid refresh token");
    }

    await this.prisma.refreshSession.update({
      where: { id: session.id },
      data: { isRevoked: true },
    });
  }

  async logoutAll(userId: string) {
    await this.prisma.refreshSession.updateMany({
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
    const expiresAt = new Date();
    expiresAt.setDate(
      expiresAt.getDate() + this.config.refreshTokenExpirationMinutes,
    );

    await this.prisma.refreshSession.create({
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
    const expiresAt = new Date();
    expiresAt.setDate(
      expiresAt.getDate() + this.config.refreshTokenExpirationMinutes,
    );

    await this.prisma.refreshSession.update({
      where: { id: sessionId },
      data: { tokenHash, expiresAt },
    });
  }

  private async generateTokens(userId: string) {
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(
        { sub: userId },
        { expiresIn: this.config.jwtExpirationMinutes + "m" },
      ),
      this.jwtService.signAsync(
        { sub: userId },
        { expiresIn: this.config.refreshTokenExpirationMinutes },
      ),
    ]);

    return { accessToken, refreshToken };
  }

  private generateRandomCode(length: number) {
    return Math.floor(
      10 ** (length - 1) +
        Math.random() * (10 ** length - 10 ** (length - 1) - 1),
    ).toString();
  }

  // async googleAuth(token: string) {
  //   const ticket = await this.googleClient.verifyIdToken({
  //     idToken: token,
  //     audience: process.env.GOOGLE_CLIENT_ID,
  //   });

  //   const payload = ticket.getPayload();
  //   if (!payload) {
  //     throw new UnauthorizedException("Invalid token");
  //   }

  //   const { email, name, sub: googleId } = payload;

  //   let user = await this.prisma.user.findUnique({
  //     where: { email },
  //   });

  //   if (!user) {
  //     user = await this.prisma.user.create({
  //       data: {
  //         email,
  //         name,
  //         googleId,
  //       },
  //     });
  //   } else if (!user.googleId) {
  //     user = await this.prisma.user.update({
  //       where: { id: user.id },
  //       data: { googleId },
  //     });
  //   }

  //   const jwtToken = this.generateToken(user);

  //   return {
  //     accessToken: jwtToken,
  //     user: {
  //       id: user.id,
  //       email: user.email,
  //       name: user.name,
  //       activeRole: user.activeRole,
  //     },
  //   };
  // }

  private generateToken(user: any) {
    return this.jwtService.sign({
      sub: user.id,
      email: user.email,
      role: user.activeRole,
    });
  }
}
