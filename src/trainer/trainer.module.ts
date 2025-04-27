import { Module } from "@nestjs/common";
import { TrainerController } from "./trainer.controller";
import { PrismaModule } from "../prisma/prisma.module";
import { CreateTrainerProfileUseCase } from "./use-case/create-trainer-profile";
import { GetTrainerProfileUseCase } from "./use-case/get-trainer-profile";
import { ScanTraineeQRUseCase } from "./use-case/scan-trainee-qr";
import { ScanQRAndCreateTrainingUseCase } from "./use-case/scan-and-create-training";
import { AttachToExistingUseCase } from "./use-case/attach-to-existing";
import { TrainerService } from "./trainer.service";
import { CreateGymsUseCase } from "./use-case/create-gyms";
import { CreateGroupsUseCase } from "./use-case/create-groups";
import { CreateTrainingsUseCase } from "./use-case/create-trainings";
import { PersistContactInformationUseCase } from "./use-case/create-contact-information";
import { CreateSubscriptionsUseCase } from "./use-case/create-subscriptions";
@Module({
  imports: [PrismaModule],
  controllers: [TrainerController],
  providers: [
    TrainerService,
    CreateTrainerProfileUseCase,
    GetTrainerProfileUseCase,
    ScanTraineeQRUseCase,
    ScanQRAndCreateTrainingUseCase,
    AttachToExistingUseCase,
    CreateGymsUseCase,
    CreateGroupsUseCase,
    CreateTrainingsUseCase,
    PersistContactInformationUseCase,
    CreateSubscriptionsUseCase,
  ],
})
export class TrainerModule {}
