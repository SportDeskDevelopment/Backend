import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { TrainerDto } from "../dto";
type Command = {
  trainerUserId: string;
  subscriptions: TrainerDto.CreateSubscriptionsSubscriptionsItem[];
};

@Injectable()
export class CreateSubscriptionsUseCase {
  constructor(private readonly db: PrismaService) {}
  private readonly logger = new Logger(CreateSubscriptionsUseCase.name);

  async exec(command: Command) {
    const trainer = await this.db.trainerProfile.findUnique({
      where: { id: command.trainerUserId },
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

    try {
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
    } catch (error) {
      this.logger.error(error);
      return {
        message: "Failed to create subscriptions",
      };
    }

    return {
      message: "Subscriptions created successfully",
    };
  }
}
