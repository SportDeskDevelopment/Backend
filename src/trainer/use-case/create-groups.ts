import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { TrainerDto } from "../dto";
export type Command = {
  groups: TrainerDto.CreateGroupsDtoGroupsItem[];
  trainerUserId: string;
};

@Injectable()
export class CreateGroupsUseCase {
  private readonly logger = new Logger(CreateGroupsUseCase.name);

  constructor(private readonly db: PrismaService) {}

  async exec(command: Command) {
    const trainer = await this.db.trainerProfile.findUnique({
      where: { id: command.trainerUserId },
    });

    if (!trainer) {
      throw new NotFoundException("Trainer not found");
    }

    await this.db.$transaction(async (prisma) => {
      const groups = await prisma.group.createManyAndReturn({
        data: command.groups.map((group) => ({
          name: group.name,
          gymId: group.gymId ?? null,
        })),
      });

      const results = await Promise.allSettled(
        groups.map((group) =>
          prisma.trainerProfile.update({
            data: {
              groups: {
                connect: { id: group.id },
              },
            },
            where: { id: trainer.id },
          }),
        ),
      );

      results.forEach((result) => {
        if (result.status === "rejected") this.logger.error(result.reason);
      });
    });

    return {
      message: "Group created successfully",
    };
  }
}
