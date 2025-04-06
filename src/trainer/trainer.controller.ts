import { Controller, Get, Post, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../common/decorators";
import { JwtPayload } from "../common/types/jwt-payload";
import { UserId } from "../kernel/ids";

import { CreateTrainerProfileUseCase } from "./use-case/create-trainer-profile";
import { ResponseValidation } from "../shared/lib/zod";
import { TrainerDtoSchemas } from "./dto";
import { GetTrainerProfileUseCase } from "./use-case/get-trainer-profile";

@Controller("trainer")
export class TrainerController {
  constructor(
    private readonly createTrainerProfileUseCase: CreateTrainerProfileUseCase,
    private readonly getTrainerProfileUseCase: GetTrainerProfileUseCase,
  ) {}

  @Post("profile")
  @UseGuards(JwtAuthGuard)
  @ResponseValidation(TrainerDtoSchemas.createTrainerProfileResponse)
  async createTrainerProfile(@CurrentUser() user: JwtPayload) {
    return this.createTrainerProfileUseCase.exec({
      userId: user.sub as UserId,
    });
  }

  @Get("profile")
  @UseGuards(JwtAuthGuard)
  @ResponseValidation(TrainerDtoSchemas.getTrainerProfileResponse)
  async getTrainerProfile(@CurrentUser() user: JwtPayload) {
    return this.getTrainerProfileUseCase.exec({
      userId: user.sub as UserId,
    });
  }
}
