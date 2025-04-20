import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { UserId } from "../../kernel/ids";

import * as DB from "@prisma/client";

type Command = {
  userId: UserId;
};

@Injectable()
export class CreateTrainerProfileUseCase {
  constructor(private readonly db: PrismaService) {}

  async exec({ userId }: Command) {
    const user = await this.validateUser(userId);

    const newRoles = [...user.roles, DB.RoleType.TRAINER];

    await this.db.user.update({
      where: { id: userId },
      data: { roles: newRoles },
    });

    await this.db.trainerProfile.create({
      data: { userId },
    });
  }

  private async validateUser(userId: UserId) {
    const user = await this.db.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException("User not found");
    }

    const isTrainer = user.roles.some((role) => role === DB.RoleType.TRAINER);
    if (isTrainer) {
      throw new ForbiddenException("User is already a trainer");
    }

    const hasTrainerProfile = await this.db.trainerProfile.findUnique({
      where: { userId },
    });

    if (hasTrainerProfile) {
      throw new ForbiddenException("Trainer profile already exists");
    }

    return user;
  }
}
