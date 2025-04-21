// import { Injectable, Logger, NotFoundException } from "@nestjs/common";
// import { PrismaService } from "src/prisma/prisma.service";

// export type Command = {
//   name: string;
//   type?: string;
//   startDate?: Date;
//   durationMin?: number;
//   gymId?: string;
//   groupId?: string;
//   templateId?: string;
//   trainerIds?: string[];
//   saveAsTemplate: boolean;
// };

// @Injectable()
// export class CreateTrainingsUseCase {
//   private readonly logger = new Logger(CreateTrainingsUseCase.name);

//   constructor(private readonly db: PrismaService) {}

//   async exec(command: Command) {
//     await this.validateTrinings(command);
//     //TODO CREATE VIA TEMPLATE

//     await this.db.training.create({
//       data: {
//         name: command.name,
//         type: command.type as any,
//         startDate: command.startDate,
//         durationMin: command.durationMin,
//         gymId: command.gymId ?? null,
//         groupId: command.groupId ?? null,
//         templateId: command.templateId ?? null,
//         trainers: command.trainerIds
//           ? {
//               connect: command.trainerIds.map((id) => ({ id })),
//             }
//           : undefined,
//       },
//     });

//     return {
//       message: "Training created successfully",
//     };
//   }

//   private async validateTrinings(dto: Command) {
//     if (dto.gymId) {
//       const gym = await this.db.gym.findUnique({
//         where: { id: dto.gymId },
//       });
//       if (!gym) {
//         throw new NotFoundException("Gym not found");
//       }
//     }

//     if (dto.groupId) {
//       const group = await this.db.group.findUnique({
//         where: { id: dto.groupId },
//       });
//       if (!group) {
//         throw new NotFoundException("Group not found");
//       }
//     }

//     if (dto.templateId) {
//       const template = await this.db.trainingTemplate.findUnique({
//         where: { id: dto.templateId },
//       });
//       if (!template) {
//         throw new NotFoundException("Template not found");
//       }
//     }
//   }
// }

import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { TrainerDto } from "../dto";

export type Command = {
  trainings: TrainerDto.TrainingDto[];
  trainerId: string;
};

type TrainingWindow = {
  name: string;
  start: Date;
  end: Date;
  source: "new" | "existing";
};

@Injectable()
export class CreateTrainingsUseCase {
  private readonly logger = new Logger(CreateTrainingsUseCase.name);

  constructor(private readonly db: PrismaService) {}

  async exec(command: Command) {
    await this.validateTrainings(command.trainings);
    await this.validateTrainingTime(command.trainings, command.trainerId);
    //TODO CREATE VIA TEMPLATE

    // await this.db.training.createManyAndReturn({
    //   data: {
    //     name: command.name,
    //     type: command.type as any,
    //     startDate: command.startDate,
    //     durationMin: command.durationMin,
    //     gymId: command.gymId ?? null,
    //     groupId: command.groupId ?? null,
    //     templateId: command.templateId ?? null,
    //     trainers: command.trainerIds
    //       ? {
    //           connect: command.trainerIds.map((id) => ({ id })),
    //         }
    //       : undefined,
    //   },
    // });

    return {
      message: "Training created successfully",
    };
  }

  private async validateTrainingTime(
    newTrainings: TrainerDto.TrainingDto[],
    trainerId: string,
  ) {
    console.log("🔹 Входящие newTrainings:", newTrainings);
    console.log("🔹 Входящий trainerId:", trainerId);

    const planned = this.getPlannedTrainings(newTrainings);
    console.log("🔹 Отфильтрованные planned тренировки:", planned);

    if (planned.length === 0) {
      console.log("🔹 Нет запланированных тренировок — выход из функции");
      return;
    }

    const timeRange = this.getOverallTimeRange(planned);
    console.log("🔹 Общий временной диапазон (timeRange):", timeRange);

    const existing = await this.getPossiblyConflictingTrainings(
      trainerId,
      timeRange,
    );
    console.log("🔹 Найденные существующие тренировки (existing):", existing);

    const allWindows: TrainingWindow[] = [
      ...existing.map((t) => this.toTrainingWindow(t as any, "existing")),
      ...planned.map((t) => this.toTrainingWindow(t, "new")),
    ];
    console.log("🔹 Все тренировочные окна (allWindows):", allWindows);

    const overlaps = this.findOverlaps(allWindows);
    console.log("🔹 Найденные пересечения тренировок (overlaps):", overlaps);

    if (overlaps.length > 0) {
      const messages = overlaps.map(
        ({ a, b }) =>
          `Пересечение между "${a.name}" (${a.source}) и "${b.name}" (${b.source})`,
      );
      console.log("❌ Конфликты тренировок:", messages);
      throw new BadRequestException(
        "Конфликты тренировок:\n" + messages.join("\n"),
      );
    }

    console.log("✅ Проверка завершена, пересечений нет.");
  }

  private async validateTrainings(dto: TrainerDto.TrainingDto[]) {
    const gymIds = dto
      .map((e) => e.gymId)
      .filter((id): id is string => id !== undefined);

    const groupIds = dto
      .map((e) => e.groupId)
      .filter((id): id is string => id !== undefined);

    const templateIds = dto
      .map((e) => e.templateId)
      .filter((id): id is string => id !== undefined);

    const { gyms, groups, templates } = await this.getRelatedEntities({
      gymIds,
      groupIds,
      templateIds,
    });

    const gymsMap = new Map(gyms.map((g) => [g.id, g]));
    const groupsMap = new Map(groups.map((g) => [g.id, g]));
    const templatesMap = new Map(templates.map((t) => [t.id, t]));

    for (const element of dto) {
      if (element.gymId && !gymsMap.has(element.gymId)) {
        throw new NotFoundException(`Gym not found: ${element.gymId}`);
      }

      if (element.groupId && !groupsMap.has(element.groupId)) {
        throw new NotFoundException(`Group not found: ${element.groupId}`);
      }

      if (element.templateId && !templatesMap.has(element.templateId)) {
        throw new NotFoundException(
          `Template not found: ${element.templateId}`,
        );
      }
    }
  }

  private async getRelatedEntities({
    gymIds = [],
    groupIds = [],
    templateIds = [],
  }: {
    gymIds?: string[];
    groupIds?: string[];
    templateIds?: string[];
  }) {
    const [gyms, groups, templates] = await Promise.all([
      this.getGymsByIds(gymIds),
      this.getGroupsByIds(groupIds),
      this.getTemplatesByIds(templateIds),
    ]);

    return {
      gyms,
      groups,
      templates,
    };
  }

  private async getGymsByIds(gymIds: string[]) {
    if (!gymIds.length) return [];

    const gyms = await this.db.gym.findMany({
      where: {
        id: {
          in: gymIds,
        },
      },
    });

    return gyms;
  }

  private async getGroupsByIds(groupIds: string[]) {
    if (!groupIds.length) return [];
    const groups = await this.db.group.findMany({
      where: {
        id: {
          in: groupIds,
        },
      },
    });
    return groups;
  }

  private async getTemplatesByIds(trainingTemplateIds: string[]) {
    if (!trainingTemplateIds.length) return [];
    console.log(trainingTemplateIds);
    const groups = await this.db.trainingTemplate.findMany({
      where: {
        id: {
          in: trainingTemplateIds,
        },
      },
    });
    return groups;
  }
  private getPlannedTrainings(
    trainings: TrainerDto.TrainingDto[],
  ): TrainerDto.TrainingDto[] {
    return trainings.filter((t) => t.startDate && t.durationMin != null);
  }

  private getTimeRange(training: TrainerDto.TrainingDto): {
    start: Date;
    end: Date;
  } {
    const start = new Date(training.startDate!);
    const end = new Date(start.getTime() + training.durationMin! * 60_000);

    return {
      start: new Date(start.getTime()),
      end: new Date(end.getTime()),
    };
  }

  private getOverallTimeRange(trainings: TrainerDto.TrainingDto[]): {
    start: Date;
    end: Date;
  } {
    const ranges = trainings.map(this.getTimeRange);

    const start = ranges.reduce(
      (earliest, r) => (r.start < earliest ? r.start : earliest),
      ranges[0].start,
    );

    const end = ranges.reduce(
      (latest, r) => (r.end > latest ? r.end : latest),
      ranges[0].end,
    );

    return { start, end };
  }

  private async getPossiblyConflictingTrainings(
    trainerId: string,
    timeRange: { start: Date; end: Date },
  ) {
    const lookBack = new Date(timeRange.start.getTime() - 24 * 60 * 60 * 1000);

    return this.db.training.findMany({
      where: {
        trainers: { some: { id: trainerId } },
        startDate: { gte: lookBack, lte: timeRange.end },
      },
    });
  }

  private toTrainingWindow(
    training: TrainerDto.TrainingDto,
    source: "new" | "existing",
  ): TrainingWindow {
    const { start, end } = this.getTimeRange(training);
    return {
      name: training.name ?? "Training",
      start,
      end,
      source,
    };
  }

  private findOverlaps(windows: TrainingWindow[]) {
    const sorted = [...windows].sort(
      (a, b) => a.start.getTime() - b.start.getTime(),
    );
    const overlaps: { a: TrainingWindow; b: TrainingWindow }[] = [];

    for (let i = 0; i < sorted.length - 1; i++) {
      const current = sorted[i];
      const next = sorted[i + 1];

      if (current.end > next.start) {
        overlaps.push({ a: current, b: next });
      }
    }

    return overlaps;
  }
}
