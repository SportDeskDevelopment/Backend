import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import * as DB from "@prisma/client";
import { match } from "ts-pattern";
import { Ids } from "../../../kernel/ids";
import { PrismaService } from "../../../prisma/prisma.service";
import { MarkAttendanceByNotTrainerParent } from "./parent";
import { MarkAttendanceByNotTrainerTrainee } from "./trainee";
import { MarkAttendanceByNotTrainerTraineeParent } from "./trainee-parent";
import { MarkAttendanceByNotTrainerCommand, UserInCommand } from "./types";

@Injectable()
export class MarkAttendanceByNotTrainerUseCase {
  constructor(private readonly db: PrismaService) {}

  async exec(command: MarkAttendanceByNotTrainerCommand) {
    const [user] = await Promise.all([
      this.validateUser(command.username),
      this.validateTraining(command.trainingId),
      this.validateTrainer(command.trainerUsername, command.trainerQrCodeKey),
      this.validateSubscriptionTrainee(command.subscriptionTraineeId),
    ]);

    const interestedRoles: string[] = [
      DB.RoleType.TRAINEE,
      DB.RoleType.TRAINER,
      DB.RoleType.PARENT,
    ];
    const roles = user.roles
      .filter((role) => interestedRoles.includes(role))
      .toSorted();

    if (roles.length === 0) {
      throw new BadRequestException("Unexpected roles of the user");
    }

    const executor = match(roles)
      .returnType<{
        exec: (command: MarkAttendanceByNotTrainerCommand) => Promise<unknown>;
      }>()
      .with([DB.RoleType.TRAINER], () => ({
        exec: () =>
          Promise.resolve({ status: "trainerShouldNotMarkAttendance" }),
      }))
      .with(
        [DB.RoleType.TRAINEE],
        () => new MarkAttendanceByNotTrainerTrainee(this.db, user),
      )
      .with(
        [DB.RoleType.PARENT],
        () => new MarkAttendanceByNotTrainerParent(this.db, user),
      )
      .with(
        [DB.RoleType.TRAINEE, DB.RoleType.TRAINER],
        () => new MarkAttendanceByNotTrainerTrainee(this.db, user),
      )
      .with(
        [DB.RoleType.PARENT, DB.RoleType.TRAINEE],
        () => new MarkAttendanceByNotTrainerTraineeParent(this.db),
      )
      .with(
        [DB.RoleType.PARENT, DB.RoleType.TRAINEE, DB.RoleType.TRAINER],
        () => new MarkAttendanceByNotTrainerParent(this.db, user),
      )
      .run();

    if (!executor) {
      throw new BadRequestException("Unexpected role of the user");
    }

    return executor.exec?.(command);
  }

  private async validateUser(username: Ids.Username): Promise<UserInCommand> {
    if (!username) {
      throw new BadRequestException("Username is required");
    }

    const user = await this.db.user.findUnique({
      where: { username },
      include: {
        traineeProfile: {
          include: {
            groups: { select: { id: true } },
          },
        },
        parentProfile: { select: { id: true } },
      },
    });

    if (!user?.traineeProfile && !user?.parentProfile) {
      throw new BadRequestException("User is not a trainee or parent");
    }

    return user;
  }

  private async validateTrainer(
    trainerUsername: Ids.TrainerUsername,
    qrCodeKey: string,
  ) {
    const trainer = await this.db.trainerProfile.findFirst({
      where: { user: { username: trainerUsername } },
    });

    if (!trainer) {
      throw new NotFoundException("Trainer not found");
    }

    if (trainer.qrCodeKey !== qrCodeKey) {
      throw new BadRequestException("Invalid QR code");
    }

    return trainer;
  }

  private async validateTraining(trainingId?: string) {
    if (!trainingId) return;

    const training = await this.db.training.findUnique({
      where: { id: trainingId },
    });

    if (!training) {
      throw new NotFoundException("Training not found");
    }

    return training;
  }

  private async validateSubscriptionTrainee(
    subscriptionTraineeId: Ids.SubscriptionTraineeId,
  ) {
    if (!subscriptionTraineeId) return;

    const subscriptionTrainee = await this.db.subscriptionTrainee.findUnique({
      where: { id: subscriptionTraineeId },
    });

    if (!subscriptionTrainee) {
      throw new NotFoundException("Subscription trainee not found");
    }

    return subscriptionTrainee;
  }
}
