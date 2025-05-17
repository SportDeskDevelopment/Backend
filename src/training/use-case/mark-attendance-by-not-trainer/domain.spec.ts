import { BadRequestException, NotFoundException } from "@nestjs/common";
import * as DB from "@prisma/client";
import { Ids } from "../../../kernel/ids";
import { PrismaService } from "../../../prisma/prisma.service";
import { ScanTrainerQRCodeStatus } from "./constants";
import {
  getActiveTrainingsFromDB,
  trainingToDto,
  getTrainingAmongActive,
  getTrainingStatus,
  getSubscriptionTrainees,
  createAttendance,
} from "./domain";

describe("Domain Functions", () => {
  let prisma: PrismaService;

  beforeEach(() => {
    prisma = new PrismaService();
  });

  describe("getActiveTrainingsFromDB", () => {
    it("should return active trainings within 30 minutes window", async () => {
      const trainerUsername = "trainer" as Ids.TrainerUsername;
      const mockTrainings = [
        {
          id: "training-1",
          name: "Test Training",
          type: DB.TrainingType.GROUP,
          startDate: new Date(),
          durationMin: 60,
          gymId: "gym-1",
          groupId: "group-1",
          templateId: "template-1",
          price: 100,
          attendances: [],
          group: { id: "group-1" },
        },
      ];

      jest.spyOn(prisma.training, "findMany").mockResolvedValue(mockTrainings);

      const result = await getActiveTrainingsFromDB({
        trainerUsername,
        db: prisma,
      });

      expect(result).toEqual(mockTrainings);
      expect(prisma.training.findMany).toHaveBeenCalledWith({
        where: {
          trainers: {
            some: { user: { username: trainerUsername } },
          },
          startDate: expect.any(Object),
        },
        include: {
          attendances: {
            select: {
              traineeId: true,
            },
          },
          group: {
            select: {
              id: true,
            },
          },
        },
      });
    });
  });

  describe("getTrainingStatus", () => {
    it("should return noActiveTrainings when no trainings exist", () => {
      const result = getTrainingStatus({
        trainings: [],
        trainingIds: undefined,
      });

      expect(result).toEqual({
        status: ScanTrainerQRCodeStatus.noActiveTrainings,
      });
    });

    it("should return specifyTraining when multiple trainings exist without trainingIds", () => {
      const trainings = [
        {
          id: "training-1",
          name: "Training 1",
          type: DB.TrainingType.GROUP,
          startDate: new Date(),
        },
        {
          id: "training-2",
          name: "Training 2",
          type: DB.TrainingType.GROUP,
          startDate: new Date(),
        },
      ] as DB.Training[];

      const result = getTrainingStatus({
        trainings,
        trainingIds: undefined,
      });

      expect(result).toEqual({
        trainings: trainings.map(trainingToDto),
        status: ScanTrainerQRCodeStatus.specifyTraining,
      });
    });

    it("should throw BadRequestException when invalid trainings provided", () => {
      const trainings = [
        {
          id: "training-1",
          name: "Training 1",
          type: DB.TrainingType.GROUP,
          startDate: new Date(),
        },
      ] as DB.Training[];

      expect(() =>
        getTrainingStatus({
          trainings,
          trainingIds: ["non-existent-training"] as Ids.TrainingId[],
        }),
      ).toThrow(BadRequestException);
    });
  });

  describe("getTrainingAmongActive", () => {
    const activeTrainings = [
      {
        id: "training-1",
        groupId: "group-1",
      },
      {
        id: "training-2",
        groupId: "group-2",
      },
    ] as DB.Training[];

    it("should return single training if only one exists", () => {
      const result = getTrainingAmongActive({
        activeTrainings: [activeTrainings[0]],
        trainingId: undefined,
        traineeGroupIds: undefined,
      });

      expect(result).toEqual(activeTrainings[0]);
    });

    it("should throw NotFoundException if no trainingId or traineeGroupIds provided with multiple trainings", () => {
      expect(() =>
        getTrainingAmongActive({
          activeTrainings,
          trainingId: undefined,
          traineeGroupIds: undefined,
        }),
      ).toThrow(NotFoundException);
    });

    it("should find training by traineeGroupIds", () => {
      const result = getTrainingAmongActive({
        activeTrainings,
        trainingId: undefined,
        traineeGroupIds: [activeTrainings[0].groupId as Ids.GroupId],
      });

      expect(result).toEqual(activeTrainings[0]);
    });

    it("should throw NotFoundException if no training found by traineeGroupIds", () => {
      expect(() =>
        getTrainingAmongActive({
          activeTrainings,
          trainingId: undefined,
          traineeGroupIds: ["non-existent-group"] as Ids.GroupId[],
        }),
      ).toThrow(NotFoundException);
    });

    it("should throw BadRequestException if multiple trainings found by traineeGroupIds", () => {
      expect(() =>
        getTrainingAmongActive({
          activeTrainings,
          trainingId: undefined,
          traineeGroupIds: [
            activeTrainings[0].groupId as Ids.GroupId,
            activeTrainings[1].groupId as Ids.GroupId,
          ],
        }),
      ).toThrow(BadRequestException);
    });

    it("should find training by trainingId", () => {
      const result = getTrainingAmongActive({
        activeTrainings,
        trainingId: activeTrainings[0].id as Ids.TrainingId,
        traineeGroupIds: undefined,
      });

      expect(result).toEqual(activeTrainings[0]);
    });

    it("should throw NotFoundException if no training found by trainingId", () => {
      expect(() =>
        getTrainingAmongActive({
          activeTrainings,
          trainingId: "non-existent-training" as Ids.TrainingId,
          traineeGroupIds: undefined,
        }),
      ).toThrow(NotFoundException);
    });
  });

  describe("getSubscriptionTrainees", () => {
    const mockSubscriptionTrainee: DB.Prisma.SubscriptionTraineeGetPayload<{
      include: { subscription: { select: { name: true; type: true } } };
    }> = {
      id: "sub-1",
      traineeId: "trainee-1",
      subscriptionId: "subscription-1",
      isPaid: true,
      trainingsLeft: 10,
      validUntil: new Date(),
      activeFromDate: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
      paymentId: "payment-1",
      activationType: DB.SubscriptionActivationType.WHEN_TRAINING_ATTENDED,
      subscription: {
        name: "Test Subscription",
        type: DB.SubscriptionType.PERIOD,
      },
    };

    it("should find subscription trainee by id", async () => {
      jest
        .spyOn(prisma.subscriptionTrainee, "findUnique")
        .mockResolvedValue(mockSubscriptionTrainee);

      const result = await getSubscriptionTrainees({
        subscriptionTraineeId: "sub-1" as Ids.SubscriptionTraineeId,
        db: prisma,
        userId: "user-1" as Ids.UserId,
      });

      expect(result).toEqual([mockSubscriptionTrainee]);
    });

    it("should throw NotFoundException when subscription trainee not found", async () => {
      jest
        .spyOn(prisma.subscriptionTrainee, "findUnique")
        .mockResolvedValue(null);

      await expect(
        getSubscriptionTrainees({
          subscriptionTraineeId: "sub-1" as Ids.SubscriptionTraineeId,
          db: prisma,
          userId: "user-1" as Ids.UserId,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it("should find subscription trainees by group", async () => {
      jest
        .spyOn(prisma.subscriptionTrainee, "findMany")
        .mockResolvedValue([mockSubscriptionTrainee]);

      const result = await getSubscriptionTrainees({
        trainingGroupId: "group-1" as Ids.GroupId,
        db: prisma,
        userId: "user-1" as Ids.UserId,
      });

      expect(result).toEqual([mockSubscriptionTrainee]);
    });
  });

  describe("createAttendance", () => {
    const mockUser: DB.Prisma.UserGetPayload<{
      include: { traineeProfile: true };
    }> = {
      id: "user-1",
      traineeProfile: {
        id: "trainee-1",
        userId: "user-1",
        isOnboardingCompleted: true,
        unregisteredTraineeId: null,
      },
      name: "Test User",
      email: "test@test.com",
      passwordHash: "password-hash",
      googleId: "google-id",
      preferredLang: DB.LangCode.EN,
      activeRole: DB.RoleType.TRAINER,
      isEmailConfirmed: true,
      age: 20,
      emailConfirmCode: "email-confirm-code",
      username: "test-user",
      createdAt: new Date(),
      updatedAt: new Date(),
      roles: [DB.RoleType.TRAINER],
      photoUrl: "photo-url",
    };

    const mockSubscriptionTrainee: DB.Prisma.SubscriptionTraineeGetPayload<{
      include: { subscription: { select: { name: true; type: true } } };
    }> = {
      id: "sub-1",
      traineeId: "trainee-1",
      subscriptionId: "subscription-1",
      isPaid: true,
      trainingsLeft: 10,
      validUntil: new Date(),
      activeFromDate: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
      paymentId: "payment-1",
      activationType: DB.SubscriptionActivationType.WHEN_TRAINING_ATTENDED,
      subscription: {
        name: "Test Subscription",
        type: DB.SubscriptionType.PERIOD,
      },
    };

    it("should return specifySubscription when multiple subscriptions exist", async () => {
      const result = await createAttendance({
        subscriptionTrainees: [
          mockSubscriptionTrainee,
          { ...mockSubscriptionTrainee, id: "sub-2" },
        ],
        trainingId: "training-1" as Ids.TrainingId,
        db: prisma,
        user: mockUser,
      });

      expect(result).toEqual({
        subscriptions: [
          { id: "sub-1", name: mockSubscriptionTrainee.subscription.name },
          { id: "sub-2", name: mockSubscriptionTrainee.subscription.name },
        ],
        status: ScanTrainerQRCodeStatus.specifySubscription,
      });
    });

    it("should create attendance without subscription", async () => {
      jest.spyOn(prisma.attendance, "create").mockResolvedValue({
        id: "attendance-1",
        trainingId: "training-1",
        traineeId: "trainee-1",
        status: DB.AttendanceStatus.PRESENT,
        markedAt: new Date(),
        createdByUserId: "user-1",
        subscriptionTraineeId: null,
        unregisteredTraineeId: null,
        paymentId: null,
        markedAsPaidByTrainerId: null,
      });

      const result = await createAttendance({
        subscriptionTrainees: [],
        trainingId: "training-1" as Ids.TrainingId,
        db: prisma,
        user: mockUser,
      });

      expect(result).toEqual({
        status: ScanTrainerQRCodeStatus.success,
      });
    });

    it("should create attendance with subscription and update trainingsLeft", async () => {
      jest.spyOn(prisma.attendance, "create").mockResolvedValue({
        id: "attendance-1",
        trainingId: "training-1",
        traineeId: "trainee-1",
        status: DB.AttendanceStatus.PRESENT,
        markedAt: new Date(),
        createdByUserId: "user-1",
        subscriptionTraineeId: "sub-1",
        unregisteredTraineeId: null,
        paymentId: null,
        markedAsPaidByTrainerId: null,
      });

      jest
        .spyOn(prisma.subscriptionTrainee, "findUnique")
        .mockResolvedValue(mockSubscriptionTrainee);

      jest.spyOn(prisma.subscriptionTrainee, "update").mockResolvedValue({
        ...mockSubscriptionTrainee,
        trainingsLeft: 9,
      });

      const result = await createAttendance({
        subscriptionTrainees: [mockSubscriptionTrainee],
        trainingId: "training-1" as Ids.TrainingId,
        db: prisma,
        user: mockUser,
      });

      expect(result).toEqual({
        status: ScanTrainerQRCodeStatus.success,
      });

      expect(prisma.subscriptionTrainee.update).toHaveBeenCalledWith({
        where: { id: "sub-1" },
        data: { trainingsLeft: 9 },
      });
    });
  });
});
