import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { TrainerDto } from "../dto";

type Command = {
  trainerId: string;
  subscriptions: TrainerDto.CreateSubscriptionsSubscriptionsItem[];
};

@Injectable()
export class CreateSubscriptionsUseCase {
  constructor(private readonly db: PrismaService) {}

  async exec(command: Command) {
    const trainer = await this.db.trainerProfile.findUnique({
      where: { id: command.trainerId },
      include: {
        limits: true,
        subscriptions: { select: { id: true } },
      },
    });

    if (!trainer) {
      throw new NotFoundException("Trainer not found");
    }

    if (
      trainer.subscriptions.length + command.subscriptions.length >
      trainer.limits.maxSubscriptions
    ) {
      return {
        message: `You already have ${trainer.subscriptions.length} subscriptions. You can only have total of ${trainer.limits.maxSubscriptions} subscriptions without premium`,
      };
    }

    await this.db.$transaction(
      command.subscriptions.map((s) => {
        const { groupIds, ...restParams } = s;

        return this.db.subscription.create({
          data: {
            ...restParams,
            createdById: trainer.id,
            groups: groupIds &&
              groupIds.length > 0 && {
                connect: groupIds.map((groupId) => ({ id: groupId })),
              },
          },
        });
      }),
    );

    return {
      message: "Subscriptions created successfully",
    };
  }
}
