import { Ids } from "../../../kernel/ids";
import { PrismaService } from "../../../prisma/prisma.service";
import { ScanTrainerQRCodeStatus } from "./constants";
import {
  addTraineeToTrainingGroupIfNotIn,
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

    const subscriptionTraineesResponse = await getSubscriptionTrainees({
      subscriptionTraineeId: command.subscriptionTraineeId,
      trainingGroupId: training.groupId as Ids.GroupId,
      db: this.db,
      userId: this.user.id as Ids.UserId,
    });

    if (subscriptionTraineesResponse.status) {
      return subscriptionTraineesResponse;
    }

    await addTraineeToTrainingGroupIfNotIn({
      db: this.db,
      training,
      traineeId: this.user.traineeProfile?.id as Ids.TraineeId,
      traineeGroupIds: this.user.traineeProfile?.groups?.map(
        (group) => group.id as Ids.GroupId,
      ),
    });

    return createAttendance({
      subscriptionTrainees: subscriptionTraineesResponse.subscriptionTrainees,
      trainingId: training.id as Ids.TrainingId,
      subscriptionTraineeId: command.subscriptionTraineeId,
      db: this.db,
      traineeId: this.user.traineeProfile.id as Ids.TraineeId,
      createdByUserId: this.user.id as Ids.UserId,
    });
  }
}
