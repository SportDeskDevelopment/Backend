import { PrismaService } from "../../../prisma/prisma.service";
import { UserService } from "../../../user/user.service";
import { MarkAttendanceByNotTrainerCommand } from "./types";


export class ScanTrainerQRCodeParent {
  constructor(
    private readonly db: PrismaService,
    private readonly userService: UserService,
  ) {}

  async exec(command: MarkAttendanceByNotTrainerCommand) {
    return {
      status: "success",
    };
  }
}
