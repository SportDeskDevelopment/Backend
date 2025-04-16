import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { TrainerService } from "../trainer.service";
import { TrainerDto } from "../dto";
import * as DB from "@prisma/client";

type Command = {
  trainerUserId: string;
  traineeUsername: string;
};

@Injectable()
export class ScanTraineeQRUseCase {
  constructor(
    private db: PrismaService,
    private trainerService: TrainerService,
  ) {}

  async exec(command: Command): Promise<TrainerDto.ScanTraineeResponse> {
    const trainee = await this.trainerService.getTraineeProfileByUsername(
      command.traineeUsername,
    );

    const activeTrainings = await this.getActiveTrainings(
      command.trainerUserId,
    );

    // user should specify training and call another endpoint
    if (activeTrainings.length > 1) {
      return {
        trainings: activeTrainings.map(this.trainingToDto),
        status: TrainerDto.ScanTraineeResponseStatus.specifyTraining,
      };
    }

    if (activeTrainings.length === 0) {
      return {
        status: TrainerDto.ScanTraineeResponseStatus.noActiveTraining,
      };
    }

    const activeTraining = activeTrainings[0];
    const isAlreadyAttending = activeTraining.attendances.some(
      (attendance) => attendance.traineeId === trainee.id,
    );

    if (isAlreadyAttending) {
      return {
        status: TrainerDto.ScanTraineeResponseStatus.traineeAlreadyRecorded,
      };
    }

    await this.db.attendance.create({
      data: {
        traineeId: trainee.id,
        trainingId: activeTraining.id,
        scannedByUserId: command.trainerUserId,
      },
    });

    return {
      status: TrainerDto.ScanTraineeResponseStatus.traineeRecordedSuccessfully,
    };
  }

  private async getActiveTrainings(trainerUserId: string) {
    const fifteenMinutes = 1000 * 60 * 15;
    const now = new Date();
    const from = new Date(now.getTime() - fifteenMinutes);
    const to = new Date(now.getTime() + fifteenMinutes);

    const trainings = await this.db.training.findMany({
      where: {
        trainers: {
          some: { userId: trainerUserId },
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

    if (trainings.length > 0) {
      return trainings;
    }

    const training = await this.createTrainingFromTemplate(trainerUserId);

    if (!training) return [];

    return [training];
  }

  private dayToWeekDay(day: number): DB.WeekDay {
    return {
      0: DB.WeekDay.SUNDAY,
      1: DB.WeekDay.MONDAY,
      2: DB.WeekDay.TUESDAY,
      3: DB.WeekDay.WEDNESDAY,
      4: DB.WeekDay.THURSDAY,
      5: DB.WeekDay.FRIDAY,
      6: DB.WeekDay.SATURDAY,
    }[day];
  }

  private trainingToDto(
    training: DB.Training,
  ): TrainerDto.ScanTraineeResponseTrainingsItem {
    return {
      id: training.id,
      name: training.name,
      type: training.type,
      startDate: training.startDate?.toISOString(),
    };
  }

  private async createTrainingFromTemplate(trainerUserId: string) {
    const now = new Date();
    const template = await this.getTemplate(trainerUserId);

    if (!template) return;

    // It should be only one time slot for such time range
    const timeSlot = template.timeSlots[0];
    const startDate = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      timeSlot.hours,
      timeSlot.minutes,
    );

    return this.db.training.create({
      data: {
        startDate,
        type: template.type,
        durationMin: template.durationMin,
        name: template.trainingName,
        gym: { connect: { id: template.gymId } },
        group: { connect: { id: template.groupId } },
        trainers: { connect: { userId: trainerUserId } },
        template: { connect: { id: template.id } },
      },
      include: { attendances: { select: { traineeId: true } } },
    });
  }

  private async getTemplate(trainerUserId: string) {
    const fifteenMinutes = 1000 * 60 * 15;
    const now = new Date();
    const from = new Date(now.getTime() - fifteenMinutes);
    const to = new Date(now.getTime() + fifteenMinutes);

    const currentDayOfWeek = this.dayToWeekDay(from.getDay());
    const fromHours = from.getHours();
    // const fromMinutes = from.getMinutes();

    const toHours = to.getHours();
    // const toMinutes = to.getMinutes();
    // console.log("===from===", from);
    // console.log("===to===", to);
    // console.log("===fromHours===", fromHours);
    // console.log("===toHours===", toHours);
    // console.log("===fromMinutes===", fromMinutes);
    // console.log("===toMinutes===", toMinutes);

    const timeSlotsQuery = {
      dayOfWeek: currentDayOfWeek,
      hours: {
        gte: fromHours,
        lte: toHours,
      },
      // minutes: {
      //   gte: fromMinutes,
      //   lte: toMinutes,
      // },
    };

    return this.db.trainingTemplate.findFirst({
      where: {
        trainer: { userId: trainerUserId },
        startDate: { lte: from },
        endDate: { gte: to },
        timeSlots: {
          some: timeSlotsQuery,
        },
      },
      include: {
        timeSlots: {
          where: timeSlotsQuery,
        },
      },
    });
  }
}
