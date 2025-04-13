import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { TrainerService } from "../trainer.service";
import { TrainerDto } from "../dto";

type Command = {
  trainerId: string;
  traineeUsername: string;
};

@Injectable()
export class ScanTraineeQRUseCase {
  constructor(
    private db: PrismaService,
    private trainerService: TrainerService,
  ) {}

  async exec(command: Command): Promise<TrainerDto.ScanTraineeResponse> {
    const trainee = await this.trainerService.getTraineeProfileByUsername(
      command.traineeUsername,
    );

    const trainingsCount = await this.getTrainingsCountByTrainerId(
      command.trainerId,
    );

    if (trainingsCount === 0) {
      return {
        status: TrainerDto.ScanTraineeResponseStatus.noTrainingFound,
      };
    }

    const fifteenMinutes = 1000 * 60 * 15;
    const now = new Date();
    const from = new Date(now.getTime() - fifteenMinutes);
    const to = new Date(now.getTime() + fifteenMinutes);

    const activeTrainings = await this.db.training.findMany({
      where: {
        trainers: {
          some: { id: command.trainerId },
        },
        startDate: {
          lte: to,
          gte: from,
        },
      },
      include: {
        attendances: {
          select: {
            traineeId: true,
          },
        },
      },
    });

    if (activeTrainings.length === 0) {
      return {
        status: TrainerDto.ScanTraineeResponseStatus.noActiveTraining,
      };
    }

    // user should specify training and call another endpoint
    if (activeTrainings.length > 1) {
      return {
        trainings: activeTrainings.map((training) => ({
          id: training.id,
          name: training.name,
          type: training.type,
          startDate: training.startDate?.toISOString(),
        })),
        status: TrainerDto.ScanTraineeResponseStatus.specifyTraining,
      };
    }

    const activeTraining = activeTrainings[0];
    const isAlreadyAttending = activeTraining.attendances.some(
      (attendance) => attendance.traineeId === trainee.id,
    );

    if (isAlreadyAttending) {
      return {
        status: TrainerDto.ScanTraineeResponseStatus.traineeAlreadyRecorded,
      };
    }

    await this.db.attendance.create({
      data: {
        traineeId: trainee.id,
        trainingId: activeTraining.id,
      },
    });

    return {
      status: TrainerDto.ScanTraineeResponseStatus.traineeRecordedSuccessfully,
    };
  }

  private async getTrainingsCountByTrainerId(trainerId: string) {
    return this.db.training.count({
      where: {
        trainers: {
          some: { id: trainerId },
        },
      },
    });
  }
}
