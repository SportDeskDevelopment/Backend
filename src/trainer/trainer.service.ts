import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class TrainerService {
  constructor(private readonly db: PrismaService) {}

  async getTraineeProfileByUsername(username: string) {
    const trainee = await this.db.traineeProfile.findFirst({
      where: {
        user: { username },
      },
    });

    if (!trainee) {
      throw new NotFoundException("Trainee not found");
    }

    return trainee;
  }

  async getTrainerProfileByUserId(userId: string) {
    const trainer = await this.db.trainerProfile.findUnique({
      where: { userId },
    });

    if (!trainer) {
      throw new NotFoundException("Trainer not found");
    }

    return trainer;
  }
}
