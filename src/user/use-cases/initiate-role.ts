import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import * as DB from "@prisma/client";
import { UserId } from "../../kernel/ids";

type Command = {
  userId: UserId;
  role: Exclude<DB.RoleType, "SUPERADMIN">;
};

@Injectable()
export class InitiateRoleUseCase {
  constructor(private readonly db: PrismaService) {}

  async exec({ userId, role }: Command) {
    await this.validateUser({ userId, role });

    await this.db.user.update({
      where: { id: userId },
      data: { roles: { create: { type: role } } },
    });

    const operation = {
      [DB.RoleType.TRAINER]: this.createTrainerProfile,
      [DB.RoleType.TRAINEE]: this.createTraineeProfile,
      [DB.RoleType.PARENT]: this.createParentProfile,
      [DB.RoleType.ADMIN]: this.createAdminProfile,
    }[role];

    const profileId = await operation(userId);

    return { profileId };
  }

  private async validateUser({ userId, role }: Command) {
    const user = await this.db.user.findUnique({
      where: { id: userId },
      include: { roles: true },
    });

    if (!user) {
      throw new NotFoundException("User not found");
    }

    if (user.roles.some((r) => r.type === role)) {
      throw new BadRequestException("User already has this role");
    }
  }

  private createTrainerProfile(userId: UserId) {
    return this.db.trainerProfile.create({
      data: { userId },
      select: { id: true },
    });
  }

  private createTraineeProfile(userId: UserId) {
    return this.db.traineeProfile.create({
      data: { userId },
      select: { id: true },
    });
  }

  private createParentProfile(userId: UserId) {
    return this.db.parentProfile.create({
      data: { userId },
      select: { id: true },
    });
  }

  private createAdminProfile(userId: UserId) {
    return this.db.adminProfile.create({
      data: { userId },
      select: { id: true },
    });
  }
}
