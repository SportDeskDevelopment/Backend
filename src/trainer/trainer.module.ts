import { Module } from "@nestjs/common";
import { TrainerController } from "./trainer.controller";
import { CreateTrainerProfileUseCase } from "./use-case/create-trainer-profile";
import { GetTrainerProfileUseCase } from "./use-case/get-trainer-profile";

@Module({
  controllers: [TrainerController],
  providers: [CreateTrainerProfileUseCase, GetTrainerProfileUseCase],
})
export class TrainerModule {}
