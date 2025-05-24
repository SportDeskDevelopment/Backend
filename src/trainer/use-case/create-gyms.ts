import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { TrainerDto } from "../dto";

type Command = {
  gyms: TrainerDto.CreateGymsDtoGymsItem[];
  trainerUserId: string;
};

@Injectable()
export class CreateGymsUseCase {
  private readonly logger = new Logger(CreateGymsUseCase.name);
  constructor(private readonly db: PrismaService) {}

  async exec(command: Command) {
    const trainer = await this.db.trainerProfile.findUnique({
      where: { userId: command.trainerUserId },
    });

    if (!trainer) {
      throw new NotFoundException("Trainer not found");
    }

    await this.db.$transaction(async (prisma) => {
      const gyms = await prisma.gym.createManyAndReturn({
        data: command.gyms.map((gym) => ({
          name: gym.name,
          address: gym.address,
          geoLat: gym.geoLat,
          geoLng: gym.geoLng,
          workHours: gym.workHours,
        })),
      });

      const results = await Promise.allSettled(
        gyms.map((gym) =>
          this.db.trainerProfile.update({
            data: {
              gyms: {
                connect: { id: gym.id },
              },
            },
            where: { id: trainer.id },
          }),
        ),
      );

      results.forEach((result) => {
        if (result.status === "rejected") this.logger.error(result.reason);
      });
    });

    return { message: "Gym(s) created succesfully" };
  }

  async getTrainerById(trainerId: string) {
    return this.db.trainerProfile.findUnique({
      where: { id: trainerId },
    });
  }
}
