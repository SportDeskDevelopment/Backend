import { NotFoundException } from "@nestjs/common";
import * as DB from "@prisma/client";
import { Ids } from "../../../kernel/ids";
import { PrismaService } from "../../../prisma/prisma.service";
import { ScanTrainerQRCodeStatus } from "./constants";
import {
  getActiveTrainings,
  getTrainingStatus,
  getTrainingAmongActive,
} from "./domain";
import { MarkAttendanceByNotTrainerCommand } from "./types";

export class MarkAttendanceByNotTrainerTrainee {
  constructor(
    private readonly db: PrismaService,
    private readonly user: DB.User & {
      traineeProfile: DB.TraineeProfile & { groups: { id: string }[] };
    },
  ) {}

  async exec(command: MarkAttendanceByNotTrainerCommand) {
    const trainings = await getActiveTrainings({
      trainerId: command.trainerId,
      db: this.db,
    });

    const trainingStatusResponse = getTrainingStatus({
      trainings,
      trainingId: command.trainingId,
    });

    if (trainingStatusResponse) {
      return trainingStatusResponse;
    }

    const training = getTrainingAmongActive(trainings, command.trainingId);

    const hasAlreadyMarked = training.attendances.some(
      (attendance) => attendance.traineeId === this.user.traineeProfile.id,
    );

    if (hasAlreadyMarked) {
      return { status: ScanTrainerQRCodeStatus.alreadyMarked };
    }

    const subscriptionTrainees = await this.getSubscriptionTrainees(
      command.subscriptionTraineeId,
      training.groupId as Ids.GroupId,
    );

    await this.addToGroup(training);

    const createAttendanceResponse = await this.createAttendance({
      subscriptionTrainees,
      trainingId: training.id as Ids.TrainingId,
      subscriptionTraineeId: command.subscriptionTraineeId,
    });

    if (createAttendanceResponse) {
      return createAttendanceResponse;
    }

    return {
      status: ScanTrainerQRCodeStatus.success,
    };
  }

  private async getSubscriptionTrainees(
    subscriptionTraineeId?: Ids.SubscriptionTraineeId,
    trainingGroupId?: Ids.GroupId,
  ) {
    if (subscriptionTraineeId) {
      const subscriptionTrainee = await this.db.subscriptionTrainee.findUnique({
        where: { id: subscriptionTraineeId },
        include: {
          subscription: {
            select: { name: true, type: true },
          },
        },
      });

      if (!subscriptionTrainee) {
        throw new NotFoundException("Subscription trainee not found");
      }

      return [subscriptionTrainee];
    }

    return this.db.subscriptionTrainee.findMany({
      where: {
        trainee: {
          userId: this.user.id,
        },
        subscription: {
          OR: [
            {
              groups: {
                some: { id: trainingGroupId },
              },
            },
            {
              groups: { none: {} },
            },
          ],
        },
      },
      include: {
        subscription: {
          select: { name: true, type: true },
        },
      },
    });
  }

  private async createAttendance({
    subscriptionTrainees,
    trainingId,
    subscriptionTraineeId,
  }: {
    subscriptionTrainees: (DB.SubscriptionTrainee & {
      subscription: { name: string; type: DB.SubscriptionType };
    })[];
    trainingId: Ids.TrainingId;
    subscriptionTraineeId?: Ids.SubscriptionTraineeId;
  }) {
    if (subscriptionTrainees.length > 1 && !subscriptionTraineeId) {
      return {
        subscriptions: subscriptionTrainees.map(this.subscriptionToDto),
        status: ScanTrainerQRCodeStatus.specifySubscription,
      };
    }

    if (subscriptionTrainees.length === 0) {
      await this.db.attendance.create({
        data: {
          traineeId: this.user.traineeProfile.id,
          trainingId,
          createdByUserId: this.user.id,
        },
      });
      return;
    }

    const finalSubscriptionTraineeId =
      subscriptionTraineeId ?? subscriptionTrainees[0]?.id;

    await this.db.attendance.create({
      data: {
        traineeId: this.user.traineeProfile.id,
        trainingId,
        createdByUserId: this.user.id,
        subscriptionTraineeId: finalSubscriptionTraineeId,
        //TODO:do we need this?
        status: DB.AttendanceStatus.PRESENT,
        markedAt: new Date(),
      },
    });

    const subscriptionTrainee = await this.db.subscriptionTrainee.findUnique({
      where: { id: finalSubscriptionTraineeId },
      include: {
        subscription: { select: { name: true, type: true } },
      },
    });

    if (subscriptionTrainee.subscription.type === DB.SubscriptionType.PERIOD) {
      await this.db.subscriptionTrainee.update({
        where: { id: finalSubscriptionTraineeId },
        data: {
          trainingsLeft: subscriptionTrainee.trainingsLeft - 1,
        },
      });
    }
  }

  private subscriptionToDto(
    traineeSubscription: DB.SubscriptionTrainee & {
      subscription: { name: string };
    },
  ) {
    return {
      id: traineeSubscription.id,
      name: traineeSubscription.subscription.name,
    };
  }

  private async addToGroup(training: DB.Training) {
    if (!training.groupId) return;

    const isInThisGroup = this.user?.traineeProfile?.groups?.some(
      (group) => group.id === training.groupId,
    );

    if (isInThisGroup) return;

    await this.db.group.update({
      where: {
        id: training.groupId,
      },
      data: {
        trainees: {
          connect: {
            id: this.user?.traineeProfile?.id,
          },
        },
      },
    });
  }
}
