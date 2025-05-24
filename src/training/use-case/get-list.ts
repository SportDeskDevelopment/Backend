import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { TrainingDto } from "../dto";
import * as DB from "@prisma/client";

export type Query = TrainingDto.GetListRequest;

@Injectable()
export class GetListUseCase {
  constructor(private readonly db: PrismaService) {}

  async exec(query: Query) {
    const {
      page = 1,
      limit = 10,
      search,
      sortBy = "id",
      sortOrder = "asc",
      filters,
    } = query;

    const where: DB.Prisma.TrainingWhereInput = {
      startDate: {
        gte: filters?.startDate,
      },
      ...(filters?.gymIds && {
        gymId: {
          in: filters.gymIds,
        },
      }),
      ...(filters?.groupIds && {
        groupId: {
          in: filters.groupIds,
        },
      }),
      ...(filters?.trainerIds && {
        trainers: {
          some: {
            id: { in: filters.trainerIds },
          },
        },
      }),
      ...(search && {
        name: { contains: search, mode: "insensitive" },
      }),
    };

    const skip = (page - 1) * limit;
    const trainings = await this.db.training.findMany({
      where,
      orderBy: {
        [sortBy]: sortOrder,
      },
      take: limit,
      skip,
      include: {
        gym: {
          select: {
            name: true,
          },
        },
        group: {
          select: {
            name: true,
          },
        },
        trainers: {
          select: {
            id: true,
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    const total = await this.db.training.count({ where });

    return {
      trainings: trainings.map(this.mapToDto),
      total,
    };
  }

  private mapToDto(
    training: DB.Prisma.TrainingGetPayload<{
      include: {
        gym: true;
        group: true;
        trainers: {
          include: {
            user: true;
          };
        };
      };
    }>,
  ): TrainingDto.TrainingDto {
    return {
      id: training.id,
      name: training.name,
      startDate: training.startDate.toISOString(),
      gymName: training.gym?.name,
      groupName: training.group?.name,
      trainers: training.trainers.map((trainer) => ({
        id: trainer.id,
        firstName: trainer.user?.firstName ?? "",
        lastName: trainer.user?.lastName ?? "",
      })),
    };
  }
}
