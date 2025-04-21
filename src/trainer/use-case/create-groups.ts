import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { TrainerDto } from "../dto";

export type Command = {
  groups: TrainerDto.CreateGroupsDtoGroupsItem[];
  trainerId: string;
};

@Injectable()
export class CreateGroupsUseCase {
  private readonly logger = new Logger(CreateGroupsUseCase.name);

  constructor(private readonly db: PrismaService) {}

  async exec(command: Command) {
    const trainer = await this.db.trainerProfile.findUnique({
      where: { id: command.trainerId },
    });

    if (!trainer) {
      throw new NotFoundException("Trainer not found");
    }

    const groups = await this.db.group.createManyAndReturn({
      data: command.groups.map((group) => ({
        name: group.name,
        gymId: group.gymId ?? null,
      })),
    });

    const results = await Promise.allSettled(
      groups.map((group) =>
        this.db.trainerProfile.update({
          data: {
            groups: {
              connect: { id: group.id },
            },
          },
          where: { id: command.trainerId },
        }),
      ),
    );

    results.forEach((result) => {
      if (result.status === "rejected") this.logger.error(result.reason);
    });

    return {
      message: "Group created successfully",
    };
  }
}
