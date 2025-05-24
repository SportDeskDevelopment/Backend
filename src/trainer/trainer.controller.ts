import { Body, Controller, Get, Post, Query, UseGuards } from "@nestjs/common";
import { z } from "zod";
import { LoggedInUser, Roles } from "../common/decorators";
import { JwtPayload } from "../common/types/jwt-payload";
import { AttachToExistingUseCase } from "./use-case/attach-to-existing";
import { CreateTrainerProfileUseCase } from "./use-case/create-trainer-profile";
import { GetTrainerProfileUseCase } from "./use-case/get-trainer-profile";
import { ScanQRAndCreateTrainingUseCase } from "./use-case/scan-and-create-training";
import { ScanTraineeQRUseCase } from "./use-case/scan-trainee-qr";
import { TrainerDtoSchemas } from "./dto";
import { ResponseValidation, ZodPipe } from "../shared/lib/zod";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CreateGymsUseCase } from "./use-case/create-gyms";
import { TrainerDto } from "./dto";
import * as DB from "@prisma/client";
import { RolesGuard } from "../common/guards/role.guard";
import { UserId } from "../kernel/ids/ids";
import { CreateGroupsUseCase } from "./use-case/create-groups";
import { CreateTrainingsUseCase } from "./use-case/create-trainings";
import { PersistContactInformationUseCase } from "./use-case/create-contact-information";
import { CreateSubscriptionsUseCase } from "./use-case/create-subscriptions";
import { GetTrainingAttendanceUseCase } from "./use-case/training-attendance";
import { MarkAsPaidUseCase } from "./use-case/mark-as-paid";

@Controller("trainer")
export class TrainerController {
  constructor(
    private readonly createTrainerProfileUseCase: CreateTrainerProfileUseCase,
    private readonly getTrainerProfileUseCase: GetTrainerProfileUseCase,
    private readonly scanTraineeQRUseCase: ScanTraineeQRUseCase,
    private readonly scanQRAndCreateTrainingUseCase: ScanQRAndCreateTrainingUseCase,
    private readonly attachToExistingUseCase: AttachToExistingUseCase,
    private readonly createGymUseCase: CreateGymsUseCase,
    private readonly createGroupsUseCase: CreateGroupsUseCase,
    private readonly createTrainingsUseCase: CreateTrainingsUseCase,
    private readonly persistContactInformationUseCase: PersistContactInformationUseCase,
    private readonly createSubscriptionsUseCase: CreateSubscriptionsUseCase,
    private readonly getTrainingAttendanceUseCase: GetTrainingAttendanceUseCase,
    private readonly markAsPaidUseCase: MarkAsPaidUseCase,
  ) {}

  @Post("scan-qr")
  @UseGuards(JwtAuthGuard)
  @ResponseValidation(TrainerDtoSchemas.scanTraineeResponse)
  async scanTraineeQR(
    @LoggedInUser() user: JwtPayload,
    @Body(new ZodPipe(TrainerDtoSchemas.scanTraineeBody))
    body: z.infer<typeof TrainerDtoSchemas.scanTraineeBody>,
  ) {
    return this.scanTraineeQRUseCase.exec({
      trainerUserId: user.id,
      traineeUsername: body.traineeUsername,
    });
  }

  @Post("scan-qr-and-create")
  @UseGuards(JwtAuthGuard)
  @ResponseValidation(TrainerDtoSchemas.scanAndCreateTrainingResponse)
  async scanQRAndCreate(
    @LoggedInUser() user: JwtPayload,
    @Body(new ZodPipe(TrainerDtoSchemas.scanAndCreateTrainingBody))
    body: z.infer<typeof TrainerDtoSchemas.scanAndCreateTrainingBody>,
  ) {
    return this.scanQRAndCreateTrainingUseCase.exec({
      trainerId: user.id,
      traineeUsername: body.traineeUsername,
      training: {
        ...body.training,
        startDate: body.training?.date
          ? new Date(body.training.date)
          : undefined,
      },
    });
  }

  @Post("attach-to-existing")
  async attachToExisting(
    @LoggedInUser() user: JwtPayload,
    @Body(new ZodPipe(TrainerDtoSchemas.attachToExistingTrainingBody))
    body: z.infer<typeof TrainerDtoSchemas.attachToExistingTrainingBody>,
  ) {
    return this.attachToExistingUseCase.exec({
      trainerId: user.id,
      trainingId: body.trainingId,
      traineeUsername: body.traineeUsername,
    });
  }

  @Roles([DB.RoleType.TRAINER])
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get("training-attendance")
  async getTrainingAttendance(
    @LoggedInUser() user: JwtPayload,
    @Query("page") page = 1,
    @Query("limit") limit = 10,
    @Query("order") order: "asc" | "desc" = "desc",
    @Query("group") groupId: DB.Group["id"],
    @Query("search") search: string,
    @Query("trainingType") trainingType: DB.TrainingType,
    @Query("dateRange") dateRange: [Date, Date],
    @Query("timeRange") timeRange: [Date, Date],
    @Query("isPaid") isPaid: boolean,
  ) {
    return this.getTrainingAttendanceUseCase.exec({
      trainerUserId: user.id,
      page: Number(page),
      limit: Number(limit),
      order,
      groupId,
      search,
      trainingType,
      dateRange,
      timeRange,
      isPaid,
    });
  }

  @Roles([DB.RoleType.TRAINER])
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post("mark-as-paid")
  async markAsPaid(
    @LoggedInUser() user: JwtPayload,
    @Body() body: { attandanceIds: string[] },
  ) {
    return this.markAsPaidUseCase.exec({
      userId: user.id,
      attandanceIds: body.attandanceIds,
    });
  }

  @Roles([DB.RoleType.TRAINER])
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post("create-gyms")
  async createGyms(
    @LoggedInUser() user: JwtPayload,
    @Body(new ZodPipe(TrainerDtoSchemas.createGymsBody))
    body: TrainerDto.CreateGymsDto,
  ) {
    return this.createGymUseCase.exec({
      ...body,
      trainerUserId: (body.trainerUserId ?? user.id) as UserId,
    });
  }

  @UseGuards(JwtAuthGuard)
  @Post("create-trainer")
  async createTrainer(@LoggedInUser() user: JwtPayload) {
    return this.createTrainerProfileUseCase.exec({ userId: user.id as UserId });
  }

  @Roles([DB.RoleType.TRAINER])
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post("create-groups")
  async createGroups(
    @LoggedInUser() user: JwtPayload,
    @Body(new ZodPipe(TrainerDtoSchemas.createGroupsBody))
    body: TrainerDto.CreateGroupsDto,
  ) {
    return this.createGroupsUseCase.exec({
      ...body,
      trainerUserId: user.id as UserId,
    });
  }

  @Roles([DB.RoleType.TRAINER])
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post("create-trainings")
  async createTrainings(
    @LoggedInUser() user: JwtPayload,
    @Body(new ZodPipe(TrainerDtoSchemas.createTrainingsBody))
    body: TrainerDto.CreateTrainingsRequest,
  ) {
    return this.createTrainingsUseCase.exec({
      ...body,
      trainerUserId: (body.trainerUserId ?? user.id) as UserId,
    });
  }

  @Roles([DB.RoleType.TRAINER])
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post("persist-contact-information")
  async persistContactInformation(
    @LoggedInUser() user: JwtPayload,
    @Body(new ZodPipe(TrainerDtoSchemas.persistContactInformationBody))
    body: TrainerDto.PersistContactInformation,
  ) {
    return this.persistContactInformationUseCase.exec({
      ...body,
      trainerUserId: user.id as UserId,
    });
  }

  @Roles([DB.RoleType.TRAINER])
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post("create-subscriptions")
  async createSubscriptions(
    @LoggedInUser() user: JwtPayload,
    @Body(new ZodPipe(TrainerDtoSchemas.createSubscriptionsBody))
    body: TrainerDto.CreateSubscriptions,
  ) {
    return this.createSubscriptionsUseCase.exec({
      ...body,
      trainerUserId: user.id as UserId,
    });
  }
}
