import {
  Body,
  Controller,
  NotImplementedException,
  Post,
} from "@nestjs/common";
import { MarkAttendanceByNotTrainerUseCase } from "./use-case/mark-attendance-by-not-trainer";

@Controller("training")
export class TrainingController {
  constructor(
    private readonly markAttendanceByNotTrainerUseCase: MarkAttendanceByNotTrainerUseCase,
  ) {}

  // When trainer scans training QR code
  @Post("trainer/scan-qr-code")
  async scanQR() {
    throw new NotImplementedException();
  }

  // When user scans trainer QR code
  @Post("mark-attendance-by-not-trainer")
  async markAttendance(@Body() body: any) {
    return this.markAttendanceByNotTrainerUseCase.exec(body);
  }
}
