import { Body, Controller, Post } from "@nestjs/common";
import { z } from "zod";
import { CurrentUser } from "../common/decorators";
import { JwtPayload } from "../common/types/jwt-payload";
import { AttachToExistingUseCase } from "./use-case/attach-to-existing";
import { CreateTrainerProfileUseCase } from "./use-case/create-trainer-profile";
import { GetTrainerProfileUseCase } from "./use-case/get-trainer-profile";
import { ScanQRAndCreateTrainingUseCase } from "./use-case/scan-and-create-training";
import { ScanTraineeQRUseCase } from "./use-case/scan-trainee-qr";
import { TrainerDtoSchemas } from "./dto";
import { ResponseValidation, ZodPipe } from "../shared/lib/zod";

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
  async scanTraineeQR(
    @CurrentUser() user: JwtPayload,
    @Body(new ZodPipe(TrainerDtoSchemas.scanTraineeBody))
    body: z.infer<typeof TrainerDtoSchemas.scanTraineeBody>,
  ) {
    return this.scanTraineeQRUseCase.exec({
      trainerId: user.sub,
      traineeUsername: body.traineeUsername,
    });
  }

  @Post("scan-qr-and-create")
  @ResponseValidation(TrainerDtoSchemas.scanAndCreateTrainingResponse)
  async scanQRAndCreate(
    @CurrentUser() user: JwtPayload,
    @Body(new ZodPipe(TrainerDtoSchemas.scanAndCreateTrainingBody))
    body: z.infer<typeof TrainerDtoSchemas.scanAndCreateTrainingBody>,
  ) {
    return this.scanQRAndCreateTrainingUseCase.exec({
      trainerId: user.sub,
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
    @CurrentUser() user: JwtPayload,
    @Body(new ZodPipe(TrainerDtoSchemas.attachToExistingTrainingBody))
    body: z.infer<typeof TrainerDtoSchemas.attachToExistingTrainingBody>,
  ) {
    return this.attachToExistingUseCase.exec({
      trainerId: user.sub,
      trainingId: body.trainingId,
      traineeUsername: body.traineeUsername,
    });
  }
}
