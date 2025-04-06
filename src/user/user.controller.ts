import {
  Body,
  Controller,
  Get,
  HttpCode,
  Patch,
  Post,
  UseGuards,
} from "@nestjs/common";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../common/decorators";
import { JwtPayload } from "../common/types/jwt-payload";
import { InferSchema, ZodPipe } from "../shared/lib/zod";
import { UserDto, UserDtoSchemas } from "./dto";
import { UserService } from "./user.service";
import { InitiateRoleUseCase } from "./use-cases/initiate-role";
import { UserId } from "../kernel/ids";

@Controller("users")
@UseGuards(JwtAuthGuard)
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly initiateRoleUseCase: InitiateRoleUseCase,
  ) {}

  @Get("me")
  async getCurrentUser(@CurrentUser() user: JwtPayload) {
    return this.userService.getCurrentUser(user.sub);
  }

  @Patch("me/lang")
  async updateLanguage(
    @CurrentUser() user: JwtPayload,
    @Body(new ZodPipe(UserDtoSchemas.updateUserLanguageBody))
    body: InferSchema<UserDto.UpdateLanguageRequest>,
  ) {
    return this.userService.updateLanguage(user.sub, body);
  }

  @Patch("me/role")
  async updateActiveRole(
    @CurrentUser() user: JwtPayload,
    @Body(new ZodPipe(UserDtoSchemas.updateUserRoleBody))
    body: InferSchema<UserDto.UpdateRoleRequest>,
  ) {
    return this.userService.updateActiveRole(user.sub, body);
  }

  @Post("me/role/init")
  @HttpCode(200)
  async initiateRole(
    @CurrentUser() user: JwtPayload,
    @Body(new ZodPipe(UserDtoSchemas.initializeUserRoleBody))
    body: InferSchema<typeof UserDtoSchemas.initializeUserRoleBody>,
  ) {
    return this.initiateRoleUseCase.exec({
      userId: user.sub as UserId,
      role: body.role,
    });
  }
}
