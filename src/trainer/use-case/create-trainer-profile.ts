import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { UserId } from "../../kernel/ids/ids";

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

    const limits = await this.db.defaultTrainerLimits.findFirst({
      where: {
        type: DB.PlanType.FREE,
      },
    });

    await this.db.$transaction(async (prisma) => {
      await prisma.user.update({
        where: { id: userId },
        data: {
          roles: newRoles,
          trainerProfile: {
            create: {
              limits: {
                create: {
                  maxTrainees: limits.maxTrainees,
                  maxGroups: limits.maxGroups,
                  maxGyms: limits.maxGyms,
                  maxTemplates: limits.maxTemplates,
                  maxSubscriptions: limits.maxSubscriptions,
                },
              },
            },
          },
        },
      });

      await prisma.trainerProfile.create({
        data: { userId },
      });
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
