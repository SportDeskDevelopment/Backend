import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { UserId } from "../../kernel/ids";

type Query = {
  userId: UserId;
};

@Injectable()
export class GetTrainerProfileUseCase {
  constructor(private readonly db: PrismaService) {}

  async exec({ userId }: Query) {
    const trainerProfile = await this.db.trainerProfile.findUnique({
      where: { userId },
    });

    if (!trainerProfile) {
      throw new NotFoundException("Trainer profile not found");
    }

    return trainerProfile;
  }
}
