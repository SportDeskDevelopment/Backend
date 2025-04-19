import { Injectable } from "@nestjs/common";
import * as DB from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { TrainerService } from "../trainer.service";
import { TrainerDto } from "../dto";

type Command = {
  trainerId: string;
  traineeUsername: string;
  training?: Partial<DB.Training>;
};

@Injectable()
export class ScanQRAndCreateTrainingUseCase {
  constructor(
    private db: PrismaService,
    private trainerService: TrainerService,
  ) {}

  async exec(command: Command): Promise<TrainerDto.CreateTrainingResponse> {
    const trainee = await this.trainerService.getTraineeProfileByUsername(
      command.traineeUsername,
    );

    const createdTraining = await this.db.training.create({
      data: {
        trainers: {
          connect: { id: command.trainerId },
        },
        ...command.training,
      },
    });

    await this.db.attendance.create({
      data: {
        traineeId: trainee.id,
        trainingId: createdTraining.id,
      },
    });

    return {
      status: TrainerDto.CreateTrainingResponseStatus.trainingCreated,
      trainingId: createdTraining.id,
      traineeAdded: true,
    };
  }
}
