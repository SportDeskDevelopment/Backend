import { BadRequestException } from "@nestjs/common";
import { Ids } from "../../../kernel/ids";
import { PrismaService } from "../../../prisma/prisma.service";
import {
  getActiveTrainings,
  getTrainingAmongActive,
  getTrainingStatus,
} from "./domain";
import { MarkAttendanceByNotTrainerCommand } from "./types";
import * as DB from "@prisma/client";
import { ScanTrainerQRCodeStatus } from "./constants";

export class MarkAttendanceByNotTrainerParent {
  constructor(private readonly db: PrismaService) {}

  async exec(command: MarkAttendanceByNotTrainerCommand) {
    await this.validateChildren(command.childrenIds);

    const trainings = await getActiveTrainings({
      trainerId: command.trainerId,
      db: this.db,
    });

    const trainingStatus = getTrainingStatus({
      trainings,
      trainingId: command.trainingId,
    });

    if (trainingStatus) {
      return trainingStatus;
    }

    const training = getTrainingAmongActive(trainings, command.trainingId);

    const childrenAttendanceStatus = await this.checkChildrenAttendance({
      childrenIds: command.childrenIds,
      trainingId: training.id as Ids.TrainingId,
    });

    if (childrenAttendanceStatus) {
      return childrenAttendanceStatus;
    }

    return {
      status: "success",
    };
  }

  private async validateChildren(childrenIds: Ids.ParentTraineeLinkId[]) {
    if (!childrenIds) {
      throw new BadRequestException("Children ids are required");
    }

    const children = await this.db.parentTraineeLink.findMany({
      where: {
        id: { in: childrenIds },
      },
    });

    if (children.length !== childrenIds.length) {
      throw new BadRequestException("Invalid children ids");
    }

    return children;
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
}
