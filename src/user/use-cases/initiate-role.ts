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
    this.validateSuperAdminRole(role);
    const user = await this.validateUser({ userId, role });

    const newRoles = [...user.roles, role];

    await this.db.user.update({
      where: { id: userId },
      data: { roles: newRoles, activeRole: role },
    });

    // don't create trainee profile because we already created it in register process
    const operation = {
      [DB.RoleType.TRAINER]: this.createTrainerProfile,
      [DB.RoleType.PARENT]: this.createParentProfile,
      [DB.RoleType.ADMIN]: this.createAdminProfile,
    }[role];

    const profileId = await operation(userId);

    return { profileId };
  }

  private validateSuperAdminRole(role: DB.RoleType) {
    if (role !== DB.RoleType.SUPERADMIN) return;

    throw new BadRequestException("Super admin role cannot be initiated");
  }

  private async validateUser({ userId, role }: Command) {
    const user = await this.db.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException("User not found");
    }

    if (user.roles.some((r) => r === role)) {
      throw new BadRequestException("User already has this role");
    }

    return user;
  }

  private createTrainerProfile(userId: UserId) {
    return this.db.trainerProfile.create({
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
