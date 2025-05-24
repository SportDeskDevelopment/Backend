import {
  Body,
  Controller,
  Get,
  NotImplementedException,
  Post,
  Query,
} from "@nestjs/common";
import { MarkAttendanceByNotTrainerUseCase } from "./use-case/mark-attendance-by-not-trainer";
import { TrainingDto, TrainingDtoSchemas } from "./dto";
import { GetListUseCase } from "./use-case/get-list";
import { ResponseValidation, ZodPipe } from "../shared/lib/zod";

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

  @Get("get-list")
  @ResponseValidation(TrainingDtoSchemas.getListResponse)
  async getList(
    @Query(new ZodPipe(TrainingDtoSchemas.getListQueryParams))
    query: TrainingDto.GetListRequest,
  ) {
    return this.getListUseCase.exec(query);
  }
}
