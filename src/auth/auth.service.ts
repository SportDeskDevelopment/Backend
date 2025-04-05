import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";
import { PrismaService } from "../prisma/prisma.service";
import { AuthDto } from "./dto";

@Injectable()
export class AuthService {
  // private googleClient: OAuth2Client;

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {
    // this.googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
  }

  async register(body: AuthDto.RegisterRequest) {
    const isUserExist = await this.prisma.user.findUnique({
      where: { email: body.email },
    });

    if (isUserExist) {
      throw new ConflictException("Email already exists");
    }

    const hashedPassword = await bcrypt.hash(body.password, 10);

    const user = await this.prisma.user.create({
      data: {
        email: body.email,
        passwordHash: hashedPassword,
        name: body.name,
      },
    });

    const token = this.generateToken(user);

    return { accessToken: token };
  }

  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException("Invalid credentials");
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      throw new UnauthorizedException("Invalid credentials");
    }

    const token = this.generateToken(user);

    return {
      accessToken: token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        activeRole: user.activeRole,
      },
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
