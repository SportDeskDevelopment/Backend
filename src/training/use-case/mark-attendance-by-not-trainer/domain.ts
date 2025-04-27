import { NotFoundException } from "@nestjs/common";
import * as DB from "@prisma/client";
import { Ids } from "../../../kernel/ids";
import { PrismaService } from "../../../prisma/prisma.service";

export async function getActiveTrainings({
  trainerId,
  db,
}: {
  trainerId: Ids.TrainerId;
  db: PrismaService;
}) {
  const thirtyMinutes = 1000 * 60 * 30;
  const now = new Date();
  const from = new Date(now.getTime() - thirtyMinutes);
  const to = new Date(now.getTime() + thirtyMinutes);

  const trainings = await db.training.findMany({
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

export function trainingToDto(training: DB.Training) {
  return {
    id: training.id,
    name: training.name,
    type: training.type,
    startDate: training.startDate?.toISOString(),
  };
}

export function getTrainingAmongActive(
  activeTrainings: (DB.Training & { attendances: { traineeId: string }[] })[],
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
