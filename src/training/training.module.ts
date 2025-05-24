import { Module } from "@nestjs/common";
import { TrainingController } from "./training.controller";
import { TrainingService } from "./training.service";
import { UserModule } from "../user/user.module";
import { MarkAttendanceByNotTrainerUseCase } from "./use-case/mark-attendance-by-not-trainer";
import { GetListUseCase } from "./use-case/get-list";

@Module({
  imports: [UserModule],
  controllers: [TrainingController],
  providers: [
    TrainingService,
    MarkAttendanceByNotTrainerUseCase,
    GetListUseCase,
  ],
})
export class TrainingModule {}
