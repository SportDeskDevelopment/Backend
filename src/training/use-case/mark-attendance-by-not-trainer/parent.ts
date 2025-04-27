import { PrismaService } from "../../../prisma/prisma.service";
import { MarkAttendanceByNotTrainerCommand } from "./types";

export class MarkAttendanceByNotTrainerParent {
  constructor(private readonly db: PrismaService) {}

  async exec(command: MarkAttendanceByNotTrainerCommand) {
    return {
      status: "success",
    };
  }
}
