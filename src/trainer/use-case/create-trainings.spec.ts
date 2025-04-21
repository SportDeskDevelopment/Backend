import { Test, TestingModule } from "@nestjs/testing";
import { CreateTrainingsUseCase } from "./create-trainings";
import { PrismaService } from "../../prisma/prisma.service";
import { BadRequestException, NotFoundException } from "@nestjs/common";
import { TrainerDto } from "../dto";
import { PlanType, Sports, TrainingType } from "@prisma/client";

describe("CreateTrainingsUseCase", () => {
  let useCase: CreateTrainingsUseCase;
  let prismaService: PrismaService;

  const mockTrainerProfile = {
    id: "trainer-1",
    userId: "user-1",
    description: "Test trainer",
    trainingSince: 2020,
    sports: [Sports.KARATE],
    publicContactId: "contact-1",
    currentPlan: PlanType.FREE,
    planStartedAt: new Date(),
    planUntil: new Date(),
    trialActivatedAt: new Date(),
  };

  const mockGym = {
    id: "gym-1",
    name: "Test Gym",
    createdAt: new Date(),
    updatedAt: new Date(),
    address: "Test Address",
    geoLat: 0,
    geoLng: 0,
    workHours: "9-18",
  };

  const mockGroup = {
    id: "group-1",
    name: "Test Group",
    gymId: "gym-1",
  };

  const mockTraining = {
    id: "training-1",
    name: "Test Training",
    gymId: "gym-1",
    type: TrainingType.GROUP,
    groupId: "group-1",
    durationMin: 60,
    startDate: new Date(),
    templateId: "template-1",
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateTrainingsUseCase,
        {
          provide: PrismaService,
          useValue: {
            trainerProfile: {
              findUnique: jest.fn(),
              findMany: jest.fn(),
            },
            training: {
              createManyAndReturn: jest.fn(),
              update: jest.fn(),
              findMany: jest.fn(),
            },
            gym: {
              findMany: jest.fn(),
            },
            group: {
              findMany: jest.fn(),
            },
            trainingTemplate: {
              findMany: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    useCase = module.get<CreateTrainingsUseCase>(CreateTrainingsUseCase);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  it("should create trainings successfully", async () => {
    const command: TrainerDto.CreateTrainingsRequest = {
      trainings: [
        {
          name: "Test Training",
          startDate: "2024-03-20T10:00:00Z",
          durationMin: 60,
          gymId: "gym-1",
          groupId: "group-1",
          trainerIds: ["trainer-1"],
        },
      ],
      trainerId: "trainer-1",
    };

    jest
      .spyOn(prismaService.trainerProfile, "findUnique")
      .mockResolvedValue(mockTrainerProfile);
    jest
      .spyOn(prismaService.trainerProfile, "findMany")
      .mockResolvedValue([mockTrainerProfile]);
    jest.spyOn(prismaService.gym, "findMany").mockResolvedValue([mockGym]);
    jest.spyOn(prismaService.group, "findMany").mockResolvedValue([mockGroup]);
    jest
      .spyOn(prismaService.trainingTemplate, "findMany")
      .mockResolvedValue([]);
    jest.spyOn(prismaService.training, "findMany").mockResolvedValue([]);
    jest
      .spyOn(prismaService.training, "createManyAndReturn")
      .mockResolvedValue([mockTraining]);
    jest
      .spyOn(prismaService.training, "update")
      .mockResolvedValue(mockTraining);

    const result = await useCase.exec(command);

    expect(result).toEqual({ message: "Trainings created successfully" });
    expect(prismaService.training.createManyAndReturn).toHaveBeenCalled();
    expect(prismaService.training.update).toHaveBeenCalled();
  });

  it("should throw NotFoundException when trainer not found", async () => {
    const command: TrainerDto.CreateTrainingsRequest = {
      trainings: [
        {
          name: "Test Training",
          startDate: "2024-03-20T10:00:00Z",
          durationMin: 60,
        },
      ],
      trainerId: "non-existent-trainer",
    };

    jest
      .spyOn(prismaService.trainerProfile, "findUnique")
      .mockResolvedValue(null);

    await expect(useCase.exec(command)).rejects.toThrow(NotFoundException);
  });

  it("should throw BadRequestException when there are time conflicts", async () => {
    const command: TrainerDto.CreateTrainingsRequest = {
      trainings: [
        {
          name: "Test Training",
          startDate: "2024-03-20T10:00:00Z",
          durationMin: 60,
        },
      ],
      trainerId: "trainer-1",
    };

    const existingTraining = {
      ...mockTraining,
      startDate: new Date("2024-03-20T10:30:00Z"),
    };

    jest
      .spyOn(prismaService.trainerProfile, "findUnique")
      .mockResolvedValue(mockTrainerProfile);
    jest
      .spyOn(prismaService.training, "findMany")
      .mockResolvedValue([existingTraining]);

    await expect(useCase.exec(command)).rejects.toThrow(BadRequestException);
  });

  it("should throw NotFoundException when gym not found", async () => {
    const command: TrainerDto.CreateTrainingsRequest = {
      trainings: [
        {
          name: "Test Training",
          startDate: "2024-03-20T10:00:00Z",
          durationMin: 60,
          gymId: "non-existent-gym",
        },
      ],
      trainerId: "trainer-1",
    };

    jest
      .spyOn(prismaService.trainerProfile, "findUnique")
      .mockResolvedValue(mockTrainerProfile);
    jest.spyOn(prismaService.gym, "findMany").mockResolvedValue([]);

    await expect(useCase.exec(command)).rejects.toThrow(NotFoundException);
  });
});
