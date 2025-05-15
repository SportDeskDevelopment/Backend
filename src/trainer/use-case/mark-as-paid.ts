import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { UserId } from "../../kernel/ids/ids";

type Command = {
  userId: UserId;
  attandanceIds: string[];
};

@Injectable()
export class MarkAsPaidUseCase {
  constructor(private readonly db: PrismaService) {}

  async exec({ userId, attandanceIds }: Command) {
    const { trainerProfile } = await this.validateTrainer({
      userId,
      attandanceIds,
    });

    await this.db.attendance.updateMany({
      where: { id: { in: attandanceIds } },
      data: {
        markedAsPaidByTrainerId: trainerProfile.id,
      },
    });

    return {
      message: "Attandances marked as paid",
    };
  }

  private async validateTrainer({ userId, attandanceIds }: Command) {
    const trainerProfile = await this.db.trainerProfile.findUnique({
      where: { userId },
    });

    const attandances = await this.db.attendance.findMany({
      where: { id: { in: attandanceIds } },
      include: {
        training: {
          include: {
            trainers: true,
          },
        },
      },
    });

    if (attandances.length === 0) {
      throw new NotFoundException("Attandances not found");
    }

    if (!trainerProfile) {
      throw new NotFoundException("Trainer profile not found");
    }

    if (
      attandances.some((a) =>
        a.training.trainers.every((t) => t.id !== trainerProfile.id),
      )
    ) {
      throw new BadRequestException(
        "Trainer is not a trainer of this training",
      );
    }

    const alreadyPaid = attandances.find(
      (a) => a.subscriptionTraineeId !== null || a.paymentId !== null,
    );

    if (alreadyPaid) {
      throw new BadRequestException(
        `Attandance ${alreadyPaid.id} already paid`,
      );
    }

    return {
      trainerProfile,
    };
  }
}
