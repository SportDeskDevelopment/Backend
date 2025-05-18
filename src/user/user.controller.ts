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
import { LoggedInUser } from "../common/decorators";
import { JwtPayload } from "../common/types/jwt-payload";
import { UserId } from "../kernel/ids/ids";
import { InferSchema, ResponseValidation, ZodPipe } from "../shared/lib/zod";
import { UserDto, UserDtoSchemas } from "./dto";
import { InitiateRoleUseCase } from "./use-cases/initiate-role";
import { UserService } from "./user.service";

@Controller("users")
@UseGuards(JwtAuthGuard)
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly initiateRoleUseCase: InitiateRoleUseCase,
  ) {}

  @Get("me")
  @ResponseValidation(UserDtoSchemas.getCurrentUserResponse)
  async getCurrentUser(@LoggedInUser() user: JwtPayload) {
    return this.userService.getCurrentUser(user.id);
  }

  @Patch("me/lang")
  async updateLanguage(
    @LoggedInUser() user: JwtPayload,
    @Body(new ZodPipe(UserDtoSchemas.updateUserLanguageBody))
    body: InferSchema<UserDto.UpdateLanguageRequest>,
  ) {
    return this.userService.updateLanguage(user.id, body);
  }

  @Patch("me/role")
  async updateActiveRole(
    @LoggedInUser() user: JwtPayload,
    @Body(new ZodPipe(UserDtoSchemas.updateUserRoleBody))
    body: InferSchema<UserDto.UpdateRoleRequest>,
  ) {
    return this.userService.updateActiveRole(user.id, body);
  }

  @Post("me/role/init")
  @HttpCode(200)
  async initiateRole(
    @LoggedInUser() user: JwtPayload,
    @Body(new ZodPipe(UserDtoSchemas.initializeUserRoleBody))
    body: InferSchema<typeof UserDtoSchemas.initializeUserRoleBody>,
  ) {
    return this.initiateRoleUseCase.exec({
      userId: user.id as UserId,
      role: body.role,
    });
  }
}
