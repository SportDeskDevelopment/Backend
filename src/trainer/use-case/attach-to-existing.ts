import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { z } from "zod";

const AttachToExistingInput = z.object({
  trainerId: z.string(),
  trainingId: z.string(),
  traineeUsername: z.string(),
});

type AttachToExistingInput = z.infer<typeof AttachToExistingInput>;

@Injectable()
export class AttachToExistingUseCase {
  constructor(private prisma: PrismaService) {}

  async exec(input: AttachToExistingInput) {
    // const { trainerId, trainingId, traineeUsername } =
    //   AttachToExistingInput.parse(input);
    // const trainee = await this.prisma.user.findUnique({
    //   where: { username: traineeUsername },
    //   include: {
    //     roles: {
    //       where: { type: "TRAINEE" },
    //     },
    //   },
    // });
    // if (!trainee || !trainee.roles.length) {
    //   throw new NotFoundException("Trainee not found");
    // }
    // const training = await this.prisma.training.findUnique({
    //   where: { id: trainingId },
    //   include: { attendances: true },
    // });
    // if (!training) {
    //   throw new NotFoundException("Training not found");
    // }
    // if (training.trainerId !== trainerId) {
    //   throw new ForbiddenException("Training does not belong to this trainer");
    // }
    // const isAlreadyAttending = training.attendances.some(
    //   (attendance) => attendance.userId === trainee.id,
    // );
    // if (isAlreadyAttending) {
    //   return { status: "already_attending" };
    // }
    // await this.prisma.attendance.create({
    //   data: {
    //     userId: trainee.id,
    //     trainingId: training.id,
    //   },
    // });
    // return { status: "added_to_existing_training" };
  }
}
