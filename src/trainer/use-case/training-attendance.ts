import {
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import * as DB from "@prisma/client";
type Command = {
  trainerUserId: string;
  page: number;
  limit: number;
  order: "asc" | "desc";
  groupId: DB.Group["id"];
  search: string;
  trainingType: DB.TrainingType;
  dateRange: [Date, Date];
  timeRange: [Date, Date];
  isPaid: boolean;
};

// @Injectable()
// export class GetTrainingAttendanceUseCase {
//   private readonly logger = new Logger(GetTrainingAttendanceUseCase.name);
//   constructor(private readonly db: PrismaService) {}

//   async exec(command: Command) {
//     const { trainerUserId, trainingId } = command;
//     const trainer = await this.db.trainerProfile.findUnique({
//       where: { userId: trainerUserId },
//     });
//     if (!trainer) {
//       throw new NotFoundException("Trainer not found");
//     }

//     const training = await this.db.training.findUnique({
//       where: { id: trainingId },
//     });

//     if (!training) {
//       throw new NotFoundException("Training not found");
//     }
//     const attendance = await this.db.attendance.findMany({
//       where: {
//         trainingId,
//       },
//       include: {
//         unregisteredTrainee: true,
//         trainee: true,
//       },
//     });
//     return attendance;
//   }
// }

//TODO ADD FILTERS: GROUP + SEARCH + TRAINING TYPE + DATE RANGE + TIME RANGE + ?isPaid
@Injectable()
export class GetTrainingAttendanceUseCase {
  private readonly logger = new Logger(GetTrainingAttendanceUseCase.name);
  constructor(private readonly db: PrismaService) {}

  async exec(command: Command) {
    const {
      trainerUserId,
      page,
      limit,
      order,
      groupId,
      search,
      trainingType,
      dateRange,
      timeRange,
      isPaid,
    } = command;

    const trainer = await this.db.trainerProfile.findUnique({
      where: { userId: trainerUserId },
      include: { user: true },
    });

    if (!trainer) {
      throw new NotFoundException("Trainer not found");
    }

    if (!trainer.user.isEmailConfirmed) {
      throw new UnauthorizedException("Email not verified");
    }

    const searchQuery = search
      ? {
          OR: [
            { trainee: { user: { username: { contains: search } } } },
            { unregisteredTrainee: { displayName: { contains: search } } },
          ],
        }
      : {};

    const trainings = await this.db.training.findMany({
      where: {
        trainers: { some: { id: trainer.id } },
        groupId,
        type: trainingType,
        startDate: { gte: dateRange[0], lte: dateRange[1] },
        attendances: {
          some: {
            ...searchQuery,
          },
        },
      },
      orderBy: { startDate: order },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        attendances: {
          include: {
            trainee: true,
            unregisteredTrainee: true,
          },
        },
      },
    });

    const total = await this.db.training.count({
      where: { trainers: { some: { id: trainer.id } } },
    });

    return {
      data: trainings,
      pagination: {
        total,
        page,
        limit,
        order,
      },
    };
  }
}
