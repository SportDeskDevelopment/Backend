import { BadRequestException } from "@nestjs/common";
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
import { MarkAttendanceByNotTrainerCommand } from "./types";

export class MarkAttendanceByNotTrainerParent {
  constructor(private readonly db: PrismaService) {}

  async exec(command: MarkAttendanceByNotTrainerCommand) {
    if (!command.childrenTrainings) {
      throw new BadRequestException("Info about children is required");
    }

    const childrenAttendanceStatus = await this.checkChildrenAttendance({
      childrenIds: command.childrenTrainings.map((item) => item.childId),
      trainingId: command.trainingId,
    });

    if (childrenAttendanceStatus) {
      return childrenAttendanceStatus;
    }

    const childrenTrainings = await this.validateChildren(
      command.childrenTrainings,
    );

    const activeTrainings = await getActiveTrainingsFromDB({
      trainerUsername: command.trainerUsername,
      db: this.db,
    });

    const trainingStatus = getTrainingStatus({
      trainings: activeTrainings,
      trainingIds: childrenTrainings.map((child) => child.trainingId),
    });

    if (trainingStatus) {
      return trainingStatus;
    }

    for (const childTraining of childrenTrainings) {
      const training = getTrainingAmongActive({
        activeTrainings,
        trainingId: childTraining.trainingId,
        traineeGroupIds: childTraining.traineeGroupIds,
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

      const isAlreadyMarked = trainingDB.attendances.some(
        (attendance) => attendance.traineeId === childTraining.traineeId,
      );

      if (isAlreadyMarked) continue;

      const subscriptionTrainees = await getSubscriptionTrainees({
        db: this.db,
        subscriptionTraineeId: childTraining.subscriptionTraineeId,
        trainingGroupId: training.groupId as Ids.GroupId,
        userId: childTraining.trainee.user.id as Ids.UserId,
      });

      await createAttendance({
        db: this.db,
        subscriptionTrainees: subscriptionTrainees,
        trainingId: training.id as Ids.TrainingId,
        subscriptionTraineeId: childTraining.subscriptionTraineeId,
        user: childTraining.trainee.user,
      });
    }

    return {
      status: ScanTrainerQRCodeStatus.success,
    };
  }

  private async validateChildren(
    childrenTrainings: MarkAttendanceByNotTrainerCommand["childrenTrainings"],
  ) {
    if (!childrenTrainings) {
      throw new BadRequestException("Children ids are required");
    }

    const isEveryHasTrainingId = childrenTrainings.every(
      (child) => child.trainingId,
    );
    const isNoneHasTrainingId = childrenTrainings.every(
      (child) => !child.trainingId,
    );
    if (!isEveryHasTrainingId && !isNoneHasTrainingId) {
      throw new BadRequestException(
        "All children must have training id or not have it at all",
      );
    }

    const parentTraineeLinks = await this.db.parentTraineeLink.findMany({
      where: {
        traineeId: { in: childrenTrainings.map((child) => child.childId) },
      },
      include: {
        trainee: {
          include: {
            groups: { select: { id: true } },
            user: { include: { traineeProfile: true } },
          },
        },
      },
    });

    if (parentTraineeLinks.length !== childrenTrainings.length) {
      throw new BadRequestException("Invalid children ids");
    }

    const childrenTrainingsRecord = childrenTrainings.reduce(
      (acc, child) => {
        acc[child.childId] = { ...child };
        return acc;
      },
      {} as Record<
        Ids.ParentTraineeLinkId,
        MarkAttendanceByNotTrainerCommand["childrenTrainings"][number]
      >,
    );

    return parentTraineeLinks.map((child) => ({
      ...child,
      trainingId: childrenTrainingsRecord[child.traineeId]?.trainingId,
      subscriptionTraineeId:
        childrenTrainingsRecord[child.traineeId]?.subscriptionTraineeId,
      traineeGroupIds: child.trainee?.groups?.map(
        (group) => group.id as Ids.GroupId,
      ),
    }));
  }

  private async checkChildrenAttendance({
    childrenIds,
    trainingId,
  }: {
    childrenIds: Ids.ParentTraineeLinkId[];
    trainingId: Ids.TrainingId;
  }) {
    const childrenAttendance = await this.db.attendance.findMany({
      where: {
        traineeId: { in: childrenIds },
        trainingId,
      },
    });

    if (childrenAttendance.length === childrenIds.length) {
      return {
        status: ScanTrainerQRCodeStatus.alreadyMarked,
      };
    }
  }

  // private async createAttendance({
  //   subscriptionTrainees,
  //   trainingId,
  //   subscriptionTraineeId,
  // }: {
  //   subscriptionTrainees: (DB.SubscriptionTrainee & {
  //     subscription: { name: string; type: DB.SubscriptionType };
  //   })[];
  //   trainingId: Ids.TrainingId;
  //   subscriptionTraineeId?: Ids.SubscriptionTraineeId;
  // }) {
  //   if (subscriptionTrainees.length > 1 && !subscriptionTraineeId) {
  //     return {
  //       subscriptions: subscriptionTrainees.map(this.subscriptionToDto),
  //       status: ScanTrainerQRCodeStatus.specifySubscription,
  //     };
  //   }

  //   if (subscriptionTrainees.length === 0) {
  //     await this.db.attendance.create({
  //       data: {
  //         traineeId: this.user.traineeProfile.id,
  //         trainingId,
  //         createdByUserId: this.user.id,
  //       },
  //     });
  //   }

  //   const finalSubscriptionTraineeId =
  //     subscriptionTraineeId ?? subscriptionTrainees[0].id;

  //   await this.db.attendance.create({
  //     data: {
  //       traineeId: this.user.traineeProfile.id,
  //       trainingId,
  //       createdByUserId: this.user.id,
  //       subscriptionTraineeId: finalSubscriptionTraineeId,
  //       //TODO:do we need this?
  //       status: DB.AttendanceStatus.PRESENT,
  //       markedAt: new Date(),
  //     },
  //   });

  //   const subscriptionTrainee = await this.db.subscriptionTrainee.findUnique({
  //     where: { id: finalSubscriptionTraineeId },
  //     include: {
  //       subscription: { select: { name: true, type: true } },
  //     },
  //   });

  //   if (subscriptionTrainee.subscription.type === DB.SubscriptionType.PERIOD) {
  //     await this.db.subscriptionTrainee.update({
  //       where: { id: finalSubscriptionTraineeId },
  //       data: {
  //         trainingsLeft: subscriptionTrainee.trainingsLeft - 1,
  //       },
  //     });
  //   }

  //   return {
  //     status: ScanTrainerQRCodeStatus.success,
  //   };
  // }
}
