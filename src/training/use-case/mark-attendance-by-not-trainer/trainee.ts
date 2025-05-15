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
import { MarkAttendanceByNotTrainerCommand } from "./types";

export class MarkAttendanceByNotTrainerTrainee {
  constructor(
    private readonly db: PrismaService,
    private readonly user: DB.User & {
      traineeProfile: DB.TraineeProfile & {
        groups: { id: string }[];
      };
    },
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
      traineeGroupIds: this.user.traineeProfile.groups.map(
        (group) => group.id as Ids.GroupId,
      ),
    });

    const isAlreadyMarked = training.attendances.some(
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

    return createAttendance({
      subscriptionTrainees,
      trainingId: training.id as Ids.TrainingId,
      subscriptionTraineeId: command.subscriptionTraineeId,
      db: this.db,
      user: this.user,
    });
  }

  // private async getSubscriptionTrainees(
  //   subscriptionTraineeId?: Ids.SubscriptionTraineeId,
  //   trainingGroupId?: Ids.GroupId,
  // ) {
  //   if (subscriptionTraineeId) {
  //     const subscriptionTrainee = await this.db.subscriptionTrainee.findUnique({
  //       where: { id: subscriptionTraineeId },
  //       include: {
  //         subscription: {
  //           select: { name: true, type: true },
  //         },
  //       },
  //     });

  //     if (!subscriptionTrainee) {
  //       throw new NotFoundException("Subscription trainee not found");
  //     }

  //     return [subscriptionTrainee];
  //   }

  //   return this.db.subscriptionTrainee.findMany({
  //     where: {
  //       trainee: {
  //         userId: this.user.id,
  //       },
  //       subscription: {
  //         OR: [
  //           {
  //             groups: {
  //               some: { id: trainingGroupId },
  //             },
  //           },
  //           {
  //             groups: { none: {} },
  //           },
  //         ],
  //       },
  //     },
  //     include: {
  //       subscription: {
  //         select: { name: true, type: true },
  //       },
  //     },
  //   });
  // }

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

  //     return {
  //       status: ScanTrainerQRCodeStatus.success,
  //     };
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
  //       subscription: { select: { type: true } },
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

  // private subscriptionToDto(
  //   traineeSubscription: DB.SubscriptionTrainee & {
  //     subscription: { name: string };
  //   },
  // ) {
  //   return {
  //     id: traineeSubscription.id,
  //     name: traineeSubscription.subscription.name,
  //   };
  // }
}
