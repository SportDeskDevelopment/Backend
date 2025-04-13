import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class TrainerService {
  constructor(private readonly db: PrismaService) {}

  async getTraineeProfileByUsername(username: string) {
    // const user = await this.db.user.findUnique({
    //   where: { username },
    //   include: {
    //     roles: { where: { type: DB.RoleType.TRAINEE } },
    //   },
    // });

    // if (!user) {
    //   throw new NotFoundException("User not found");
    // }

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
}
