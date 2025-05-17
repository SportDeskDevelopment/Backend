import {
  AttendanceStatus,
  Prisma,
  SubscriptionActivationType,
  SubscriptionType,
  TrainingType,
  LangCode,
  RoleType,
} from "@prisma/client";
import { Ids } from "../../../kernel/ids";
import { PrismaService } from "../../../prisma/prisma.service";
import { ScanTrainerQRCodeStatus } from "./constants";
import { MarkAttendanceByNotTrainerTrainee } from "./trainee";
import { MarkAttendanceByNotTrainerCommand, UserInCommand } from "./types";

describe("MarkAttendanceByNotTrainerTrainee", () => {
  let service: MarkAttendanceByNotTrainerTrainee;
  let prisma: PrismaService;
  let mockUser: UserInCommand;

  beforeEach(() => {
    prisma = new PrismaService();
    mockUser = {
      id: "user-1",
      username: "trainee",
      email: "trainee@example.com",
      name: "Test Trainee",
      roles: [RoleType.TRAINEE],
      traineeProfile: {
        id: "trainee-1",
        userId: "user-1",
        groups: [{ id: "group-1" }],
        unregisteredTraineeId: null,
      },
      passwordHash: "password",
      preferredLang: LangCode.EN,
      activeRole: RoleType.TRAINEE,
      isEmailConfirmed: true,
      age: 20,
      emailConfirmCode: "code",
      photoUrl: "url",
      createdAt: new Date(),
      updatedAt: new Date(),
    } as UserInCommand;
    service = new MarkAttendanceByNotTrainerTrainee(prisma, mockUser);
  });

  // afterEach(async () => {
  //   await prisma.attendance.deleteMany();
  //   await prisma.subscriptionTrainee.deleteMany();
  //   await prisma.training.deleteMany();
  // });

  describe("exec", () => {
    it("should return success when marking unpaid attendance only with username and trainerId for group where trainee is a member", async () => {
      const command: MarkAttendanceByNotTrainerCommand = {
        trainerQrCodeKey: "key",
        trainerUsername: "trainer" as Ids.TrainerUsername,
        username: mockUser.username as Ids.Username,
      };

      const mockTraining: Prisma.TrainingGetPayload<{
        include: { attendances: true };
      }> = {
        id: "training-1",
        name: "Test Training",
        type: TrainingType.GROUP,
        startDate: new Date(),
        durationMin: 60,
        gymId: "gym-1",
        groupId: mockUser.traineeProfile.groups[0]?.id,
        templateId: "template-1",
        price: 100,
        attendances: [],
      };

      jest.spyOn(prisma.training, "findMany").mockResolvedValue([mockTraining]);
      jest.spyOn(prisma.subscriptionTrainee, "findMany").mockResolvedValue([]);

      jest.spyOn(prisma.attendance, "create").mockResolvedValue({
        id: "attendance-1",
        trainingId: mockTraining.id,
        traineeId: mockUser.traineeProfile.id,
        status: AttendanceStatus.PRESENT,
        markedAt: new Date(),
        createdByUserId: mockUser.id,
        subscriptionTraineeId: null,
        unregisteredTraineeId: null,
        paymentId: null,
        markedAsPaidByTrainerId: null,
      });

      const result = await service.exec(command);

      expect(result).toEqual({
        status: ScanTrainerQRCodeStatus.success,
      });

      expect(prisma.training.findMany).toHaveBeenCalled();
      expect(prisma.attendance.create).toHaveBeenCalled();
    });

    it("should return success and add trainee to group when marking unpaid attendance only with username and trainerId for group where trainee is not a member", async () => {
      const command: MarkAttendanceByNotTrainerCommand = {
        trainerQrCodeKey: "key",
        trainerUsername: "trainer" as Ids.TrainerUsername,
        username: mockUser.username as Ids.Username,
      };

      const mockTraining: Prisma.TrainingGetPayload<{
        include: { attendances: true };
      }> = {
        id: "training-1",
        name: "Test Training",
        type: TrainingType.GROUP,
        startDate: new Date(),
        durationMin: 60,
        gymId: "gym-1",
        groupId: "group-2", // Different from trainee's group
        templateId: "template-1",
        price: 100,
        attendances: [],
      };

      jest.spyOn(prisma.training, "findMany").mockResolvedValue([mockTraining]);
      jest.spyOn(prisma.subscriptionTrainee, "findMany").mockResolvedValue([]);

      jest.spyOn(prisma.group, "update").mockResolvedValue({
        id: "group-2",
        name: "Test Group",
        gymId: "gym-1",
      });

      jest.spyOn(prisma.attendance, "create").mockResolvedValue({
        id: "attendance-1",
        trainingId: mockTraining.id,
        traineeId: mockUser.traineeProfile.id,
        status: AttendanceStatus.PRESENT,
        markedAt: new Date(),
        createdByUserId: mockUser.id,
        subscriptionTraineeId: null,
        unregisteredTraineeId: null,
        paymentId: null,
        markedAsPaidByTrainerId: null,
      });

      const result = await service.exec(command);

      expect(result).toEqual({
        status: ScanTrainerQRCodeStatus.success,
      });

      expect(prisma.group.update).toHaveBeenCalled();
      expect(prisma.training.findMany).toHaveBeenCalled();
      expect(prisma.attendance.create).toHaveBeenCalled();
    });

    it("should return alreadyMarked when trainee is already marked for this training", async () => {
      const command: MarkAttendanceByNotTrainerCommand = {
        trainerQrCodeKey: "key",
        trainerUsername: "trainer" as Ids.TrainerUsername,
        username: mockUser.username as Ids.Username,
      };

      const mockTraining: Prisma.TrainingGetPayload<{
        include: { attendances: true };
      }> = {
        id: "training-1",
        name: "Test Training",
        type: TrainingType.GROUP,
        startDate: new Date(),
        durationMin: 60,
        gymId: "gym-1",
        groupId: "group-2", // Different from trainee's group
        templateId: "template-1",
        price: 100,
        attendances: [
          {
            id: "attendance-1",
            trainingId: "training-1",
            traineeId: mockUser.traineeProfile.id,
            status: AttendanceStatus.PRESENT,
            markedAt: new Date(),
            createdByUserId: "user-1",
            subscriptionTraineeId: null,
            unregisteredTraineeId: null,
            paymentId: null,
            markedAsPaidByTrainerId: null,
          },
        ],
      };

      jest.spyOn(prisma.training, "findMany").mockResolvedValue([mockTraining]);
      jest.spyOn(prisma.attendance, "create");

      const result = await service.exec(command);

      expect(prisma.training.findMany).toHaveBeenCalled();
      expect(result).toEqual({
        status: ScanTrainerQRCodeStatus.alreadyMarked,
      });
      expect(prisma.attendance.create).not.toHaveBeenCalled();
    });

    it("should return noActiveTrainings when there are no active trainings", async () => {
      const command: MarkAttendanceByNotTrainerCommand = {
        trainerQrCodeKey: "key",
        trainerUsername: "trainer" as Ids.TrainerUsername,
        username: mockUser.username as Ids.Username,
      };

      jest.spyOn(prisma.training, "findMany").mockResolvedValue([]);
      jest.spyOn(prisma.attendance, "create");

      const result = await service.exec(command);

      expect(result).toEqual({
        status: ScanTrainerQRCodeStatus.noActiveTrainings,
      });
      expect(prisma.training.findMany).toHaveBeenCalled();
      expect(prisma.attendance.create).not.toHaveBeenCalled();
    });

    it("should return success when marking attendance with subscriptionTraineeId", async () => {
      const command: MarkAttendanceByNotTrainerCommand = {
        trainerQrCodeKey: "key",
        trainerUsername: "trainer" as Ids.TrainerUsername,
        username: "trainee" as Ids.Username,
        subscriptionTraineeId: "sub-1" as Ids.SubscriptionTraineeId,
      };

      const mockTraining: Prisma.TrainingGetPayload<{
        include: { attendances: true };
      }> = {
        id: "training-1",
        name: "Test Training",
        type: TrainingType.GROUP,
        startDate: new Date(),
        durationMin: 60,
        gymId: "gym-1",
        groupId: "group-1",
        templateId: "template-1",
        price: 100,
        attendances: [],
      };

      jest.spyOn(prisma.training, "findMany").mockResolvedValue([mockTraining]);

      const mockSubscriptionTrainee: Prisma.SubscriptionTraineeGetPayload<{
        include: { subscription: { select: { name: true; type: true } } };
      }> = {
        id: "sub-1",
        traineeId: mockUser.traineeProfile.id,
        subscriptionId: "subscription-1",
        isPaid: true,
        trainingsLeft: 10,
        paymentId: "payment-1",
        validUntil: new Date(),
        activeFromDate: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        activationType: SubscriptionActivationType.WHEN_TRAINING_ATTENDED,
        subscription: {
          name: "Test Subscription",
          type: SubscriptionType.PERIOD,
        },
      };

      jest
        .spyOn(prisma.subscriptionTrainee, "findUnique")
        .mockResolvedValue(mockSubscriptionTrainee);

      jest.spyOn(prisma.attendance, "create").mockResolvedValue({
        id: "attendance-1",
        trainingId: mockTraining.id,
        traineeId: mockUser.traineeProfile.id,
        status: AttendanceStatus.PRESENT,
        markedAt: new Date(),
        createdByUserId: mockUser.id,
        subscriptionTraineeId: mockSubscriptionTrainee.id,
        unregisteredTraineeId: null,
        paymentId: null,
        markedAsPaidByTrainerId: null,
      });

      jest.spyOn(prisma.subscriptionTrainee, "update").mockResolvedValue({
        ...mockSubscriptionTrainee,
        trainingsLeft: mockSubscriptionTrainee.trainingsLeft - 1,
      });

      const result = await service.exec(command);

      expect(result).toEqual({
        status: ScanTrainerQRCodeStatus.success,
      });

      expect(prisma.training.findMany).toHaveBeenCalled();

      expect(prisma.subscriptionTrainee.findUnique).toHaveBeenCalled();

      expect(prisma.attendance.create).toHaveBeenCalled();

      expect(prisma.subscriptionTrainee.update).toHaveBeenCalledWith({
        where: { id: mockSubscriptionTrainee.id },
        data: {
          trainingsLeft: mockSubscriptionTrainee.trainingsLeft - 1,
        },
      });
    });

    it("should return success when marking attendance with subscription and trainingId", async () => {
      const command: MarkAttendanceByNotTrainerCommand = {
        trainerQrCodeKey: "key",
        trainerUsername: "trainer" as Ids.TrainerUsername,
        username: "trainee" as Ids.Username,
        trainingId: "training-1" as Ids.TrainingId,
        subscriptionTraineeId: "sub-1" as Ids.SubscriptionTraineeId,
      };

      const mockTraining: Prisma.TrainingGetPayload<{
        include: { attendances: true };
      }> = {
        id: "training-1",
        name: "Test Training",
        type: TrainingType.GROUP,
        startDate: new Date(),
        durationMin: 60,
        gymId: "gym-1",
        groupId: "group-1",
        templateId: "template-1",
        price: 100,
        attendances: [],
      };

      jest.spyOn(prisma.training, "findMany").mockResolvedValue([mockTraining]);

      const mockSubscriptionTrainee: Prisma.SubscriptionTraineeGetPayload<{
        include: { subscription: { select: { name: true; type: true } } };
      }> = {
        id: "sub-1",
        traineeId: "trainee-1",
        subscriptionId: "subscription-1",
        isPaid: true,
        trainingsLeft: 10,
        paymentId: "payment-1",
        validUntil: new Date(),
        activeFromDate: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        activationType: SubscriptionActivationType.WHEN_TRAINING_ATTENDED,
        subscription: {
          name: "Test Subscription",
          type: SubscriptionType.PERIOD,
        },
      };

      jest
        .spyOn(prisma.subscriptionTrainee, "findUnique")
        .mockResolvedValue(mockSubscriptionTrainee);

      jest.spyOn(prisma.attendance, "create").mockResolvedValue({
        id: "attendance-1",
        trainingId: "training-1",
        traineeId: "trainee-1",
        status: AttendanceStatus.PRESENT,
        markedAt: new Date(),
        createdByUserId: "user-1",
        subscriptionTraineeId: "sub-1",
        unregisteredTraineeId: null,
        paymentId: null,
        markedAsPaidByTrainerId: null,
      });

      jest.spyOn(prisma.subscriptionTrainee, "update").mockResolvedValue({
        ...mockSubscriptionTrainee,
        trainingsLeft: mockSubscriptionTrainee.trainingsLeft - 1,
      });

      const result = await service.exec(command);

      expect(result).toEqual({
        status: ScanTrainerQRCodeStatus.success,
      });

      expect(prisma.subscriptionTrainee.update).toHaveBeenCalledWith({
        where: { id: "sub-1" },
        data: {
          trainingsLeft: mockSubscriptionTrainee.trainingsLeft - 1,
        },
      });

      expect(prisma.attendance.create).toHaveBeenCalled();
    });

    it("should return alreadyMarked when attendance is already marked", async () => {
      const command: MarkAttendanceByNotTrainerCommand = {
        trainerQrCodeKey: "key",
        trainerUsername: "trainer" as Ids.TrainerUsername,
        username: "trainee" as Ids.Username,
        trainingId: "training-1" as Ids.TrainingId,
      };

      const mockTraining: Prisma.TrainingGetPayload<{
        include: { attendances: true };
      }> = {
        id: "training-1",
        name: "Test Training",
        type: TrainingType.GROUP,
        startDate: new Date(),
        durationMin: 60,
        gymId: "gym-1",
        groupId: "group-1",
        templateId: "template-1",
        price: 100,
        attendances: [
          {
            id: "attendance-1",
            trainingId: "training-1",
            traineeId: "trainee-1",
            status: AttendanceStatus.PRESENT,
            markedAt: new Date(),
            createdByUserId: "user-1",
            subscriptionTraineeId: null,
            unregisteredTraineeId: null,
            paymentId: null,
            markedAsPaidByTrainerId: null,
          },
        ],
      };

      jest.spyOn(prisma.training, "findMany").mockResolvedValue([mockTraining]);

      const result = await service.exec(command);

      expect(result).toEqual({
        status: ScanTrainerQRCodeStatus.alreadyMarked,
      });
    });

    it("should add trainee to group if not already in it", async () => {
      const command: MarkAttendanceByNotTrainerCommand = {
        trainerQrCodeKey: "key",
        trainerUsername: "trainer" as Ids.TrainerUsername,
        username: "trainee" as Ids.Username,
        trainingId: "training-1" as Ids.TrainingId,
      };

      const mockTraining: Prisma.TrainingGetPayload<{
        include: { attendances: true };
      }> = {
        id: "training-1",
        name: "Test Training",
        type: TrainingType.GROUP,
        startDate: new Date(),
        durationMin: 60,
        gymId: "gym-1",
        groupId: "group-2", // Different from trainee's group
        templateId: "template-1",
        price: 100,
        attendances: [],
      };

      jest.spyOn(prisma.training, "findMany").mockResolvedValue([mockTraining]);
      jest.spyOn(prisma.group, "update").mockResolvedValue({
        id: "group-2",
        name: "Test Group",
        gymId: "gym-1",
      });

      jest.spyOn(prisma.attendance, "create").mockResolvedValue({
        id: "attendance-1",
        trainingId: "training-1",
        traineeId: "trainee-1",
        status: AttendanceStatus.PRESENT,
        markedAt: new Date(),
        createdByUserId: "user-1",
        subscriptionTraineeId: null,
        unregisteredTraineeId: null,
        paymentId: null,
        markedAsPaidByTrainerId: null,
      });

      await service.exec(command);

      expect(prisma.group.update).toHaveBeenCalledWith({
        where: { id: "group-2" },
        data: { trainees: { connect: { id: mockUser.traineeProfile.id } } },
      });
    });

    it("should return noActiveTrainings when training is not found", async () => {
      const command: MarkAttendanceByNotTrainerCommand = {
        trainerQrCodeKey: "key",
        trainerUsername: "trainer" as Ids.TrainerUsername,
        username: "trainee" as Ids.Username,
        trainingId: "non-existent" as Ids.TrainingId,
      };

      jest.spyOn(prisma.training, "findMany").mockResolvedValue([]);

      const result = await service.exec(command);

      expect(result).toEqual({
        status: ScanTrainerQRCodeStatus.noActiveTrainings,
      });
    });

    it("should return specifyTraining when multiple trainings are available and trainingId is not provided", async () => {
      const command: MarkAttendanceByNotTrainerCommand = {
        trainerQrCodeKey: "key",
        trainerUsername: "trainer" as Ids.TrainerUsername,
        username: "trainee" as Ids.Username,
      };

      const mockTraining1: Prisma.TrainingGetPayload<{
        include: { attendances: true };
      }> = {
        id: "training-1",
        name: "Test Training",
        type: TrainingType.GROUP,
        startDate: new Date(),
        durationMin: 60,
        gymId: "gym-1",
        groupId: "group-1",
        templateId: "template-1",
        price: 100,
        attendances: [],
      };

      const mockTraining2: Prisma.TrainingGetPayload<{
        include: { attendances: true };
      }> = {
        id: "training-2",
        name: "Test Training 2",
        type: TrainingType.GROUP,
        startDate: new Date(),
        durationMin: 60,
        gymId: "gym-1",
        groupId: "group-1",
        templateId: "template-1",
        price: 100,
        attendances: [],
      };

      jest
        .spyOn(prisma.training, "findMany")
        .mockResolvedValue([mockTraining1, mockTraining2]);

      const mockSubscriptionTrainees: Prisma.SubscriptionTraineeGetPayload<{
        include: { subscription: { select: { name: true; type: true } } };
      }>[] = [
        {
          id: "sub-1",
          traineeId: "trainee-1",
          subscriptionId: "subscription-1",
          isPaid: true,
          trainingsLeft: 10,
          paymentId: "payment-1",
          validUntil: new Date(),
          activeFromDate: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
          activationType: SubscriptionActivationType.WHEN_TRAINING_ATTENDED,
          subscription: {
            name: "Subscription 1",
            type: SubscriptionType.PERIOD,
          },
        },
        {
          id: "sub-2",
          traineeId: "trainee-1",
          subscriptionId: "subscription-2",
          isPaid: true,
          trainingsLeft: 10,
          paymentId: "payment-2",
          validUntil: new Date(),
          activeFromDate: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
          activationType: SubscriptionActivationType.WHEN_TRAINING_ATTENDED,
          subscription: {
            name: "Subscription 2",
            type: SubscriptionType.PERIOD,
          },
        },
      ];

      jest
        .spyOn(prisma.subscriptionTrainee, "findMany")
        .mockResolvedValue(mockSubscriptionTrainees);

      const result = await service.exec(command);

      expect(result).toEqual({
        status: ScanTrainerQRCodeStatus.specifyTraining,
        trainings: [
          {
            id: mockTraining1.id,
            name: mockTraining1.name,
            type: mockTraining1.type,
            startDate: mockTraining1.startDate?.toISOString(),
          },
          {
            id: mockTraining2.id,
            name: mockTraining2.name,
            type: mockTraining2.type,
            startDate: mockTraining2.startDate?.toISOString(),
          },
        ],
      });
    });
  });
});
