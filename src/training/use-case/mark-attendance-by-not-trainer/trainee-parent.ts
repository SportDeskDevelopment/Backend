import { PrismaService } from "../../../prisma/prisma.service";
import { MarkAttendanceByNotTrainerCommand } from "./types";

export class MarkAttendanceByNotTrainerTraineeParent {
  constructor(private readonly db: PrismaService) {}

  async exec(command: MarkAttendanceByNotTrainerCommand) {
    return {
      status: "success",
    };
  }
}
