import * as DB from "@prisma/client";
import { Ids } from "../../../kernel/ids";
import { PrismaService } from "../../../prisma/prisma.service";
import { ScanTrainerQRCodeStatus } from "./constants";
import {
  createAttendance,
  getActiveTrainingsFromDB,
  getSubscriptionTrainees,
  getTrainingAmongActive,
  getTrainingStatus,
} from "./domain";
import { MarkAttendanceByNotTrainerCommand, UserInCommand } from "./types";

export class MarkAttendanceByNotTrainerTrainee {
  constructor(
    private readonly db: PrismaService,
    private readonly user: UserInCommand,
  ) {}

  async exec(command: MarkAttendanceByNotTrainerCommand) {
    const activeTrainings = await getActiveTrainingsFromDB({
      trainerUsername: command.trainerUsername,
      db: this.db,
    });

    const trainingStatusResponse = getTrainingStatus({
      trainings: activeTrainings,
      trainingIds: command.trainingId ? [command.trainingId] : undefined,
    });

    if (trainingStatusResponse) {
      return trainingStatusResponse;
    }

    const training = getTrainingAmongActive({
      activeTrainings,
      trainingId: command.trainingId,
      traineeGroupIds: this.user.traineeProfile?.groups?.map(
        (group) => group.id as Ids.GroupId,
      ),
    });

    const isAlreadyMarked = training.attendances?.some(
      (attendance) => attendance.traineeId === this.user.traineeProfile.id,
    );

    if (isAlreadyMarked) {
      return { status: ScanTrainerQRCodeStatus.alreadyMarked };
    }

    const subscriptionTrainees = await getSubscriptionTrainees({
      subscriptionTraineeId: command.subscriptionTraineeId,
      trainingGroupId: training.groupId as Ids.GroupId,
      db: this.db,
      userId: this.user.id as Ids.UserId,
    });

    await this.addToGroup(training);

    return createAttendance({
      subscriptionTrainees,
      trainingId: training.id as Ids.TrainingId,
      subscriptionTraineeId: command.subscriptionTraineeId,
      db: this.db,
      user: this.user,
    });
  }

  private async addToGroup(training: DB.Training) {
    if (!training.groupId) return;

    const isInThisGroup = this.user?.traineeProfile?.groups?.some(
      (group) => group.id === training.groupId,
    );

    if (isInThisGroup) return;

    await this.db.group.update({
      where: { id: training.groupId },
      data: { trainees: { connect: { id: this.user.traineeProfile.id } } },
    });
  }
}
