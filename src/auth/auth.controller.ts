import {
  Controller,
  Post,
  Body,
  Req,
  Res,
  UseGuards,
  Inject,
} from "@nestjs/common";
import { AuthService } from "./auth.service";
import { AuthDto, AuthDtoSchemas } from "./dto";
import { RefreshDto } from "./dto/refresh.dto";
import { Request, Response } from "express";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";
import { REFRESH_TOKEN_COOKIE_NAME } from "./constants";
import { EnvConfig, envConfig } from "../config/config.env";
import { ZodPipe } from "../shared/lib/zod";

@Controller("auth")
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    @Inject(envConfig.KEY)
    private readonly config: EnvConfig,
  ) {}

  @Post("register")
  async register(
    @Body(new ZodPipe(AuthDtoSchemas.registerUserBody))
    body: AuthDto.RegisterRequest,
  ) {
    return this.authService.register(body);
  }

  @Post("login")
  async login(
    @Body(new ZodPipe(AuthDtoSchemas.loginUserBody))
    body: AuthDto.LoginRequest,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const tokens = await this.authService.login(body, {
      ip: req.ip,
      userAgent: req.headers["user-agent"],
    });

    res.cookie(REFRESH_TOKEN_COOKIE_NAME, tokens.refreshToken, {
      httpOnly: true,
      secure: this.config.nodeEnv === "production",
      sameSite: "strict",
      maxAge: this.config.refreshTokenExpirationMinutes * 60 * 1000,
    });

    return res.json({ accessToken: tokens.accessToken });
  }

  @Post("confirm-email")
  async confirmEmail(
    @Body(new ZodPipe(AuthDtoSchemas.confirmEmailBody))
    body: AuthDto.ConfirmEmailRequest,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const tokens = await this.authService.confirmEmail(body, {
      ip: req.ip,
      userAgent: req.headers["user-agent"],
    });

    res.cookie(REFRESH_TOKEN_COOKIE_NAME, tokens.tokens.refreshToken, {
      httpOnly: true,
      secure: this.config.nodeEnv === "production",
      sameSite: "strict",
      maxAge: this.config.refreshTokenExpirationMinutes * 60 * 1000,
    });

    return res.json({ accessToken: tokens.tokens.accessToken });
  }

  @Post("refresh")
  async refresh(
    @Body(new ZodPipe(RefreshDto))
    body: RefreshDto,
    @Res() res: Response,
  ) {
    const tokens = await this.authService.refresh(body);

    res.cookie(REFRESH_TOKEN_COOKIE_NAME, tokens.refreshToken, {
      httpOnly: true,
      secure: this.config.nodeEnv === "production",
      sameSite: "strict",
      maxAge: this.config.refreshTokenExpirationMinutes * 60 * 1000,
    });

    return res.json({ accessToken: tokens.accessToken });
  }

  @Post("logout")
  @UseGuards(JwtAuthGuard)
  async logout(@Req() req: Request, @Res() res: Response) {
    const refreshToken = req.cookies[REFRESH_TOKEN_COOKIE_NAME];
    if (refreshToken) {
      await this.authService.logout(refreshToken);
    }
    res.clearCookie(REFRESH_TOKEN_COOKIE_NAME);
    return res.json({ message: "Logged out successfully" });
  }

  @Post("logout-all")
  @UseGuards(JwtAuthGuard)
  async logoutAll(@Req() req: Request) {
    await this.authService.logoutAll(req.user["sub"]);
    return { message: "Logged out from all devices" };
  }

  // @Post("google")
  // async googleAuth(@Body("token") token: string) {
  //   return this.authService.googleAuth(token);
  // }
}
