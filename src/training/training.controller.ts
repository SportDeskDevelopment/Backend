import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  NotImplementedException,
  Post,
} from "@nestjs/common";
import { ResponseValidation, ZodPipe } from "../shared/lib/zod";
import { TrainingDto, TrainingDtoSchemas } from "./dto";
import { GetListUseCase } from "./use-case/get-list";
import { MarkAttendanceByNotTrainerUseCase } from "./use-case/mark-attendance-by-not-trainer";

@Controller("training")
export class TrainingController {
  constructor(
    private readonly markAttendanceByNotTrainerUseCase: MarkAttendanceByNotTrainerUseCase,
    private readonly getListUseCase: GetListUseCase,
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

  @Post("get-list")
  @HttpCode(HttpStatus.OK)
  @ResponseValidation(TrainingDtoSchemas.getListResponse)
  async getList(
    @Body(new ZodPipe(TrainingDtoSchemas.getListBody))
    query: TrainingDto.GetListRequest,
  ) {
    return this.getListUseCase.exec(query);
  }
}
