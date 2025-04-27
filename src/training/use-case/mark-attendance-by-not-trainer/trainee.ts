import { NotFoundException } from "@nestjs/common";
import * as DB from "@prisma/client";
import { Ids } from "../../../kernel/ids";
import { PrismaService } from "../../../prisma/prisma.service";
import { ScanTrainerQRCodeStatus } from "./constants";
import { MarkAttendanceByNotTrainerCommand } from "./types";

export class ScanTrainerQRCodeTrainee {
  constructor(
    private readonly db: PrismaService,
    private readonly user: DB.User & { traineeProfile: DB.TraineeProfile },
  ) {}

  async exec(command: MarkAttendanceByNotTrainerCommand) {
    const trainings = await this.getActiveTrainings(command.trainerId);

    if (trainings.length === 0) {
      return {
        status: ScanTrainerQRCodeStatus.noActiveTrainings,
      };
    }

    if (trainings.length > 1 && !command.trainingId) {
      return {
        trainings: trainings.map(this.trainingToDto),
        status: ScanTrainerQRCodeStatus.specifyTraining,
      };
    }

    const training = this.getTrainingAmongActive(trainings, command.trainingId);

    const subscriptionTrainees = await this.getSubscriptionTrainees(
      command.subscriptionTraineeId,
      training.groupId as Ids.GroupId,
    );

    await this.createAttendance({
      subscriptionTrainees,
      trainingId: training.id as Ids.TrainingId,
      subscriptionTraineeId: command.subscriptionTraineeId,
    });

    return {
      training: this.trainingToDto(training),
    };
  }

  private async getActiveTrainings(trainerId: Ids.TrainerId) {
    const thirtyMinutes = 1000 * 60 * 30;
    const now = new Date();
    const from = new Date(now.getTime() - thirtyMinutes);
    const to = new Date(now.getTime() + thirtyMinutes);

    const trainings = await this.db.training.findMany({
      where: {
        trainers: {
          some: { id: trainerId },
        },
        startDate: {
          lte: to,
          gte: from,
        },
      },
      include: {
        attendances: {
          select: {
            traineeId: true,
          },
        },
      },
    });

    return trainings;
  }

  private trainingToDto(training: DB.Training) {
    return {
      id: training.id,
      name: training.name,
      type: training.type,
      startDate: training.startDate?.toISOString(),
    };
  }

  private getTrainingAmongActive(
    activeTrainings: DB.Training[],
    trainingId?: Ids.TrainingId,
  ) {
    if (activeTrainings.length === 1) return activeTrainings[0];
    if (!trainingId) throw new NotFoundException("Training Id is not provided");

    const training = activeTrainings.find(
      (training) => training.id === trainingId,
    );

    if (!training) {
      throw new NotFoundException("Training not found among active trainings");
    }

    return training;
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
    }

    const finalSubscriptionTraineeId =
      subscriptionTraineeId ?? subscriptionTrainees[0].id;

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

    return {
      status: ScanTrainerQRCodeStatus.success,
    };
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
}
