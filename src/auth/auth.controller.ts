import { Controller, Post, Body } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { AuthDto, AuthDtoSchemas } from "./dto";
import { InferSchema, ZodPipe } from "src/shared/lib/zod";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("register")
  async register(
    @Body(new ZodPipe(AuthDtoSchemas.registerUserBody))
    body: InferSchema<AuthDto.RegisterRequest>,
  ) {
    return this.authService.register(body);
  }

  @Post("login")
  async login(
    @Body(new ZodPipe(AuthDtoSchemas.loginUserBody))
    body: InferSchema<AuthDto.LoginRequest>,
  ) {
    return this.authService.login(body);
  }

  // @Post("google")
  // async googleAuth(@Body("token") token: string) {
  //   return this.authService.googleAuth(token);
  // }
}
