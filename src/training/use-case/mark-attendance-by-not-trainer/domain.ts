import { BadRequestException, NotFoundException } from "@nestjs/common";
import * as DB from "@prisma/client";
import { Ids } from "../../../kernel/ids";
import { PrismaService } from "../../../prisma/prisma.service";
import { ScanTrainerQRCodeStatus } from "./constants";

export async function getActiveTrainingsFromDB({
  trainerUsername,
  db,
}: {
  trainerUsername: Ids.TrainerUsername;
  db: PrismaService;
}) {
  const thirtyMinutes = 1000 * 60 * 30;
  const now = new Date();
  const from = new Date(now.getTime() - thirtyMinutes);
  const to = new Date(now.getTime() + thirtyMinutes);

  const trainings = await db.training.findMany({
    where: {
      trainers: {
        some: { user: { username: trainerUsername } },
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
      group: {
        select: {
          id: true,
        },
      },
    },
  });

  return trainings;
}

export function trainingToDto(training: DB.Training) {
  return {
    id: training.id,
    name: training.name,
    type: training.type,
    startDate: training.startDate?.toISOString(),
  };
}

export function getTrainingAmongActive<TTraining extends DB.Training>({
  activeTrainings,
  trainingId,
  traineeGroupIds,
}: {
  activeTrainings: TTraining[];
  trainingId?: Ids.TrainingId;
  traineeGroupIds?: Ids.GroupId[];
}) {
  if (activeTrainings.length === 1) return activeTrainings[0];

  if (!trainingId && !traineeGroupIds) {
    throw new NotFoundException(
      "Training Id and Trainee Group Id are not provided",
    );
  }

  // look for training by trainee groups
  if (!trainingId) {
    const trainingsByGroupsOrNotBelongingToGroup = activeTrainings.filter(
      (training) =>
        traineeGroupIds.includes(training.groupId as Ids.GroupId) ||
        !training.groupId,
    );

    if (trainingsByGroupsOrNotBelongingToGroup.length === 0) {
      throw new NotFoundException(
        "No training found among active trainings by trainee group id",
      );
    }

    if (trainingsByGroupsOrNotBelongingToGroup.length > 1) {
      throw new BadRequestException(
        "More than one training found among active trainings by trainee group id",
      );
    }

    return trainingsByGroupsOrNotBelongingToGroup[0];
  }

  const training = activeTrainings.find(
    (training) => training.id === trainingId,
  );

  if (!training) {
    throw new NotFoundException("Training not found among active trainings");
  }

  return training;
}

export function getTrainingStatus({
  trainings,
  trainingIds,
}: {
  trainings: DB.Training[];
  trainingIds?: Ids.TrainingId[];
}) {
  if (trainings.length === 0) {
    return {
      status: ScanTrainerQRCodeStatus.noActiveTrainings,
    };
  }

  const areTrainingIdsProvided = trainingIds && trainingIds.length > 0;
  if (trainings.length > 1 && !areTrainingIdsProvided) {
    return {
      trainings: trainings.map(trainingToDto),
      status: ScanTrainerQRCodeStatus.specifyTraining,
    };
  }

  if (!trainingIds) return;

  const areAllTrainingsActive = trainingIds?.every((trainingId) =>
    trainings.some((training) => training.id === trainingId),
  );

  if (!areAllTrainingsActive) {
    throw new BadRequestException("Invalid trainings in getTrainingStatus");
  }
}

type SubscriptionTrainee = DB.Prisma.SubscriptionTraineeGetPayload<{
  include: {
    subscription: {
      select: { name: true; type: true };
    };
  };
}>;

type GetSubscriptionTraineesResponse = {
  status?: (typeof ScanTrainerQRCodeStatus)[keyof typeof ScanTrainerQRCodeStatus];
  mappedSubscriptionTrainees?: {
    id: string;
    name: string;
  }[];
  subscriptionTrainees?: SubscriptionTrainee[];
};

export async function getSubscriptionTrainees({
  subscriptionTraineeId,
  trainingGroupId,
  db,
  userId,
  traineeId,
}: {
  subscriptionTraineeId?: Ids.SubscriptionTraineeId;
  trainingGroupId?: Ids.GroupId;
  db: PrismaService;
  userId?: Ids.UserId;
  traineeId?: Ids.TraineeId;
}): Promise<GetSubscriptionTraineesResponse> {
  const commonWhere: DB.Prisma.SubscriptionTraineeWhereInput = {
    isPaid: true,
    AND: [
      {
        OR: [{ trainingsLeft: { gt: 0 } }, { trainingsLeft: { equals: null } }],
      },
      {
        OR: [
          { validUntil: { gte: new Date() } },
          { validUntil: { equals: null } },
        ],
      },
      {
        OR: [
          { activeFromDate: { lte: new Date() } },
          {
            AND: [
              { activeFromDate: { equals: null } },
              {
                activationType: {
                  equals: DB.SubscriptionActivationType.WHEN_TRAINING_ATTENDED,
                },
              },
            ],
          },
        ],
      },
    ],
  };

  if (subscriptionTraineeId) {
    const subscriptionTrainee = await db.subscriptionTrainee.findUnique({
      where: {
        ...commonWhere,
        id: subscriptionTraineeId,
      },
      include: {
        subscription: {
          select: { name: true, type: true },
        },
      },
    });

    if (!subscriptionTrainee) {
      throw new NotFoundException(
        `Subscription trainee not found [subscriptionTraineeId]: ${subscriptionTraineeId}, [traineeId]: ${traineeId}`,
      );
    }

    return {
      subscriptionTrainees: [subscriptionTrainee],
    };
  }

  const subscriptionTrainees = await db.subscriptionTrainee.findMany({
    where: {
      ...commonWhere,
      trainee: { OR: [{ userId }, { id: traineeId }] },
      subscription: {
        OR: [
          {
            AND: [
              {
                groups: { some: { id: trainingGroupId } },
                OR: [
                  {
                    trainingType: {
                      equals: DB.SubscriptionTrainingType.GROUP,
                    },
                  },
                  {
                    trainingType: {
                      equals: DB.SubscriptionTrainingType.GROUP_AND_INDIVIDUAL,
                    },
                  },
                ],
              },
            ],
          },
          {
            AND: [
              {
                groups: { none: {} },
                trainingType: {
                  equals: DB.SubscriptionTrainingType.INDIVIDUAL,
                },
              },
            ],
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

  if (subscriptionTrainees.length > 1) {
    return {
      mappedSubscriptionTrainees: subscriptionTrainees.map(subscriptionToDto),
      status: ScanTrainerQRCodeStatus.specifySubscription,
    };
  }

  return { subscriptionTrainees };
}

export async function createAttendance({
  subscriptionTrainees,
  trainingId,
  subscriptionTraineeId,
  db,
  traineeId,
  createdByUserId,
}: {
  subscriptionTrainees: DB.Prisma.SubscriptionTraineeGetPayload<{
    include: {
      subscription: {
        select: { name: true; type: true };
      };
    };
  }>[];
  trainingId: Ids.TrainingId;
  subscriptionTraineeId?: Ids.SubscriptionTraineeId;
  db: PrismaService;
  traineeId: Ids.TraineeId;
  createdByUserId: Ids.UserId;
}) {
  if (subscriptionTrainees.length > 1 && !subscriptionTraineeId) {
    return {
      subscriptions: subscriptionTrainees.map(subscriptionToDto),
      status: ScanTrainerQRCodeStatus.specifySubscription,
    };
  }

  if (subscriptionTrainees.length === 0) {
    await db.attendance.create({
      data: {
        traineeId,
        trainingId,
        createdByUserId,
      },
    });

    return {
      status: ScanTrainerQRCodeStatus.success,
    };
  }

  const finalSubscriptionTraineeId =
    subscriptionTraineeId ?? subscriptionTrainees[0].id;

  await db.attendance.create({
    data: {
      traineeId,
      trainingId,
      createdByUserId,
      subscriptionTraineeId: finalSubscriptionTraineeId,
      //TODO:do we need this?
      status: DB.AttendanceStatus.PRESENT,
      markedAt: new Date(),
    },
  });

  const subscriptionTrainee = await db.subscriptionTrainee.findUnique({
    where: { id: finalSubscriptionTraineeId },
    include: {
      subscription: { select: { type: true } },
    },
  });

  if (subscriptionTrainee.subscription?.type === DB.SubscriptionType.PERIOD) {
    await db.subscriptionTrainee.update({
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

export function subscriptionToDto(
  traineeSubscription: DB.SubscriptionTrainee & {
    subscription: { name: string };
  },
) {
  return {
    id: traineeSubscription.id,
    name: traineeSubscription.subscription.name,
  };
}

export async function addTraineeToTrainingGroupIfNotIn({
  training,
  db,
  traineeId,
  traineeGroupIds,
}: {
  training: DB.Training;
  db: PrismaService;
  traineeId: Ids.TraineeId;
  traineeGroupIds?: Ids.GroupId[];
}) {
  if (!training.groupId) return;

  const isInThisGroup = traineeGroupIds?.some(
    (groupId) => groupId === training.groupId,
  );

  if (isInThisGroup) return;

  await db.group.update({
    where: { id: training.groupId },
    data: { trainees: { connect: { id: traineeId } } },
  });
}
