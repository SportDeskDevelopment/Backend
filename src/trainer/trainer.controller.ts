import { Body, Controller, Post, UseGuards } from "@nestjs/common";
import { z } from "zod";
import { LoggedInUser } from "../common/decorators";
import { JwtPayload } from "../common/types/jwt-payload";
import { AttachToExistingUseCase } from "./use-case/attach-to-existing";
import { CreateTrainerProfileUseCase } from "./use-case/create-trainer-profile";
import { GetTrainerProfileUseCase } from "./use-case/get-trainer-profile";
import { ScanQRAndCreateTrainingUseCase } from "./use-case/scan-and-create-training";
import { ScanTraineeQRUseCase } from "./use-case/scan-trainee-qr";
import { TrainerDtoSchemas } from "./dto";
import { ResponseValidation, ZodPipe } from "../shared/lib/zod";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";

@Controller("trainer")
export class TrainerController {
  constructor(
    private readonly createTrainerProfileUseCase: CreateTrainerProfileUseCase,
    private readonly getTrainerProfileUseCase: GetTrainerProfileUseCase,
    private readonly scanTraineeQRUseCase: ScanTraineeQRUseCase,
    private readonly scanQRAndCreateTrainingUseCase: ScanQRAndCreateTrainingUseCase,
    private readonly attachToExistingUseCase: AttachToExistingUseCase,
  ) {}

  @Post("scan-qr")
  @UseGuards(JwtAuthGuard)
  async scanTraineeQR(
    @LoggedInUser() user: JwtPayload,
    @Body(new ZodPipe(TrainerDtoSchemas.scanTraineeBody))
    body: z.infer<typeof TrainerDtoSchemas.scanTraineeBody>,
  ) {
    return this.scanTraineeQRUseCase.exec({
      trainerUserId: user.id,
      traineeUsername: body.traineeUsername,
    });
  }

  @Post("scan-qr-and-create")
  @UseGuards(JwtAuthGuard)
  @ResponseValidation(TrainerDtoSchemas.scanAndCreateTrainingResponse)
  async scanQRAndCreate(
    @LoggedInUser() user: JwtPayload,
    @Body(new ZodPipe(TrainerDtoSchemas.scanAndCreateTrainingBody))
    body: z.infer<typeof TrainerDtoSchemas.scanAndCreateTrainingBody>,
  ) {
    return this.scanQRAndCreateTrainingUseCase.exec({
      trainerId: user.id,
      traineeUsername: body.traineeUsername,
      training: {
        ...body.training,
        startDate: body.training?.date
          ? new Date(body.training.date)
          : undefined,
      },
    });
  }

  @Post("attach-to-existing")
  async attachToExisting(
    @LoggedInUser() user: JwtPayload,
    @Body(new ZodPipe(TrainerDtoSchemas.attachToExistingTrainingBody))
    body: z.infer<typeof TrainerDtoSchemas.attachToExistingTrainingBody>,
  ) {
    return this.attachToExistingUseCase.exec({
      trainerId: user.id,
      trainingId: body.trainingId,
      traineeUsername: body.traineeUsername,
    });
  }
}
