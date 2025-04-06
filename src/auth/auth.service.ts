import {
  ConflictException,
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";
import { PrismaService } from "../prisma/prisma.service";
import { AuthDto } from "./dto";
import { EmailService } from "../email/email.service";
import { nanoid } from "nanoid";

@Injectable()
export class AuthService {
  // private googleClient: OAuth2Client;

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private emailService: EmailService,
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
    const emailConfirmCode = nanoid(6);

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

  async login(dto: AuthDto.LoginRequest) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      throw new UnauthorizedException("Invalid credentials");
    }

    if (!user.passwordHash) {
      throw new UnauthorizedException("Invalid credentials");
    }

    const isPasswordValid = await bcrypt.compare(
      dto.password,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException("Invalid credentials");
    }

    if (!user.isEmailConfirmed) {
      throw new ForbiddenException("Please confirm your email first");
    }

    const accessToken = this.jwtService.sign(
      { sub: user.id, email: user.email },
      { expiresIn: "15m" },
    );

    const refreshToken = this.jwtService.sign(
      { sub: user.id, email: user.email },
      { expiresIn: "7d" },
    );

    return {
      accessToken,
      refreshToken,
    };
  }

  async refreshToken(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException("Invalid token");
    }

    const accessToken = this.jwtService.sign(
      { sub: user.id, email: user.email },
      { expiresIn: "15m" },
    );

    const refreshToken = this.jwtService.sign(
      { sub: user.id, email: user.email },
      { expiresIn: "7d" },
    );

    return {
      accessToken,
      refreshToken,
    };
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
