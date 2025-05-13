import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import * as DB from "@prisma/client";
import { match } from "ts-pattern";
import { Ids } from "../../../kernel/ids";
import { PrismaService } from "../../../prisma/prisma.service";
import { UserService } from "../../../user/user.service";
import { MarkAttendanceByNotTrainerParent } from "./parent";
import { MarkAttendanceByNotTrainerTrainee } from "./trainee";
import { MarkAttendanceByNotTrainerTraineeParent } from "./trainee-parent";
import { MarkAttendanceByNotTrainerCommand } from "./types";

@Injectable()
export class MarkAttendanceByNotTrainerUseCase {
  constructor(
    private readonly db: PrismaService,
    private readonly userService: UserService,
  ) {}

  async exec(command: MarkAttendanceByNotTrainerCommand) {
    const [user] = await Promise.all([
      this.validateUser(command.username),
      this.validateTraining(command.trainingId),
      this.validateTrainer(command.trainerId, command.trainerQrCodeKey),
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
        () => new MarkAttendanceByNotTrainerParent(this.db),
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
        () => new MarkAttendanceByNotTrainerParent(this.db),
      )
      .run();

    if (!executor) {
      throw new BadRequestException("Unexpected role of the user");
    }

    return executor.exec?.(command);
  }

  private async validateUser(username: string) {
    const user = await this.db.user.findUnique({
      where: { username },
      include: { traineeProfile: true },
    });

    if (!user?.traineeProfile) {
      throw new BadRequestException("User is not a trainee");
    }

    return user;
  }

  private async validateTrainer(trainerId: Ids.TrainerId, qrCodeKey: string) {
    const trainer = await this.db.trainerProfile.findUnique({
      where: { id: trainerId },
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
