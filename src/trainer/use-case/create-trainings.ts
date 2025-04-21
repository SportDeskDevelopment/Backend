import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
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
    const trainer = await this.db.trainerProfile.findUnique({
      where: { id: command.trainerId },
    });

    if (!trainer) {
      throw new NotFoundException("Trainer not found");
    }

    await this.validateTrainings(command.trainings);
    await this.validateTrainingTime(command.trainings, command.trainerId);
    await this.validateTrainers(command.trainings);
    //TODO CREATE VIA TEMPLATE

    const trainings = await this.db.training.createManyAndReturn({
      data: command.trainings.map((t) => ({
        name: t.name,
        type: t.type,
        startDate: t.startDate,
        durationMin: t.durationMin,
        gymId: t.gymId,
        groupId: t.groupId,
        templateId: t.templateId,
      })),
    });

    const results = await Promise.allSettled(
      trainings.map((t) =>
        this.db.training.update({
          where: { id: t.id },
          data: {
            trainers: {
              connect: [{ id: command.trainerId }],
            },
          },
        }),
      ),
    );

    results.forEach((r) => {
      if (r.status === "rejected") {
        this.logger.error("🔹 Ошибка при обновлении тренировки:", r.reason);
      }
    });

    return {
      message: "Trainings created successfully",
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

    return { start, end };
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
    return this.db.training.findMany({
      where: {
        trainers: { some: { id: trainerId } },
        startDate: { gte: timeRange.start, lte: timeRange.end },
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
    const sorted = windows.toSorted(
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

  private async validateTrainers(trainings: TrainerDto.TrainingDto[]) {
    const trainerIds = Array.from(
      new Set(trainings.flatMap((t) => t.trainerIds)),
    );

    const trainers = await this.db.trainerProfile.findMany({
      where: { id: { in: trainerIds } },
    });

    if (trainers.length === trainerIds.length) return;

    const notFoundTrainers = new Set(
      trainerIds.filter((id) => !trainers.some((t) => t.id === id)),
    );
    this.logger.error(
      `Trainers not found: ${Array.from(notFoundTrainers).join(", ")}`,
    );

    throw new NotFoundException("Some trainers not found");
  }
}
