import { BadRequestException } from "@nestjs/common";
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

export class MarkAttendanceByNotTrainerParent {
  constructor(
    private readonly db: PrismaService,
    private readonly user: UserInCommand,
  ) {}

  async exec(command: MarkAttendanceByNotTrainerCommand) {
    if (!command.childrenAndTrainings) {
      throw new BadRequestException("Info about children is required");
    }

    const childrenTraineeWithCommandInfo =
      await this.validateAndAppendChildrenWithAdditionalInfo(
        command.childrenAndTrainings,
      );

    if (childrenTraineeWithCommandInfo.length === 0) {
      return {
        status: ScanTrainerQRCodeStatus.alreadyMarked,
      };
    }

    const activeTrainings = await getActiveTrainingsFromDB({
      trainerUsername: command.trainerUsername,
      db: this.db,
    });

    const trainingStatus = getTrainingStatus({
      trainings: activeTrainings,
      trainingIds: childrenTraineeWithCommandInfo
        .map((child) => child.commandTrainingId)
        .filter(Boolean),
    });

    if (trainingStatus) {
      return trainingStatus;
    }

    for (const childTraineeWithCommand of childrenTraineeWithCommandInfo) {
      const training = getTrainingAmongActive({
        activeTrainings,
        trainingId: childTraineeWithCommand.commandTrainingId,
        traineeGroupIds: childTraineeWithCommand.traineeGroupIds,
      });

      // get training from db to avoid concurrency issues
      // when parent and trainer or trainee mark attendance at the same time
      // because unlike for trainee, training can be changed before this cycle iteration
      const trainingDB = await this.db.training.findUnique({
        where: { id: training.id },
        include: {
          attendances: true,
        },
      });

      const isAlreadyMarked = trainingDB?.attendances?.some(
        (attendance) => attendance.traineeId === childTraineeWithCommand.id,
      );

      if (isAlreadyMarked) continue;

      const subscriptionTrainees = await getSubscriptionTrainees({
        db: this.db,
        subscriptionTraineeId:
          childTraineeWithCommand.commandSubscriptionTraineeId,
        trainingGroupId: training.groupId as Ids.GroupId,
        traineeId: childTraineeWithCommand.id,
      });

      await addTraineeToTrainingGroupIfNotIn({
        db: this.db,
        training,
        traineeId: childTraineeWithCommand.id,
        traineeGroupIds: childTraineeWithCommand.traineeGroupIds,
      });

      await createAttendance({
        db: this.db,
        subscriptionTrainees: subscriptionTrainees,
        trainingId: training.id as Ids.TrainingId,
        subscriptionTraineeId:
          childTraineeWithCommand.commandSubscriptionTraineeId,
        traineeId: childTraineeWithCommand.id,
        createdByUserId: this.user.id as Ids.UserId,
      });
    }

    return {
      status: ScanTrainerQRCodeStatus.success,
    };
  }

  private async validateAndAppendChildrenWithAdditionalInfo(
    childrenAndTrainings: MarkAttendanceByNotTrainerCommand["childrenAndTrainings"],
  ) {
    if (!childrenAndTrainings) {
      throw new BadRequestException("Children ids are required");
    }

    const isEveryHasTrainingId = childrenAndTrainings.every(
      (child) => child.trainingId,
    );
    const isNoneHasTrainingId = childrenAndTrainings.every(
      (child) => !child.trainingId,
    );

    if (!isEveryHasTrainingId && !isNoneHasTrainingId) {
      throw new BadRequestException(
        "All children must have training id or not have it at all",
      );
    }

    const parentTraineeLinks = await this.db.parentTraineeLink.findMany({
      where: {
        traineeId: {
          in: childrenAndTrainings.map((child) => child.traineeId),
        },
        parentId: this.user?.parentProfile?.id,
      },
    });

    // Check that all children are linked to the current parent
    if (parentTraineeLinks.length !== childrenAndTrainings.length) {
      throw new BadRequestException("Invalid children ids");
    }

    const childrenAttendances = await this.db.attendance.findMany({
      where: {
        traineeId: {
          in: parentTraineeLinks.map(
            (parentTraineeLink) => parentTraineeLink.traineeId,
          ),
        },
        trainingId: {
          in: childrenAndTrainings.map((child) => child.trainingId),
        },
      },
    });

    const childrenWithoutAttendance = childrenAndTrainings.filter(
      (child) =>
        !childrenAttendances.some(
          (attendance) => attendance.traineeId === child.traineeId,
        ),
    );

    const childrenTrainingsRecord = childrenWithoutAttendance.reduce(
      (acc, child) => {
        acc[child.traineeId] = child;
        return acc;
      },
      {} as Record<
        Ids.TraineeId,
        MarkAttendanceByNotTrainerCommand["childrenAndTrainings"][number]
      >,
    );

    const trainees = await this.db.traineeProfile.findMany({
      where: {
        id: {
          in: childrenWithoutAttendance.map((child) => child.traineeId),
        },
      },
      include: {
        groups: { select: { id: true } },
      },
    });

    if (trainees.length !== childrenWithoutAttendance.length) {
      throw new BadRequestException("Not all children are trainee");
    }

    return trainees.map((trainee) => ({
      ...trainee,
      id: trainee.id as Ids.TraineeId,
      commandTrainingId: childrenTrainingsRecord[trainee.id]
        ?.trainingId as Ids.TrainingId,
      commandSubscriptionTraineeId: childrenTrainingsRecord[trainee.id]
        ?.subscriptionTraineeId as Ids.SubscriptionTraineeId,
      traineeGroupIds: trainee.groups?.map((group) => group.id as Ids.GroupId),
    }));
  }
}
