import { BadRequestException } from "@nestjs/common";
import {
  AttendanceStatus,
  LangCode,
  RoleType,
  SubscriptionActivationType,
  TrainingType,
} from "@prisma/client";
import { Ids } from "../../../kernel/ids";
import { PrismaService } from "../../../prisma/prisma.service";
import { ScanTrainerQRCodeStatus } from "./constants";
import { MarkAttendanceByNotTrainerParent } from "./parent";
import { MarkAttendanceByNotTrainerCommand, UserInCommand } from "./types";

describe("MarkAttendanceByNotTrainerParent", () => {
  let parent: MarkAttendanceByNotTrainerParent;
  let db: PrismaService;
  let user: UserInCommand;

  beforeEach(() => {
    db = new PrismaService();

    user = {
      id: "user-1" as Ids.UserId,
      username: "user1" as Ids.Username,
      email: "user1@example.com",
      name: "User One",
      passwordHash: "hashed-password",
      googleId: null,
      roles: [RoleType.PARENT],
      activeRole: RoleType.PARENT,
      preferredLang: LangCode.EN,
      isEmailConfirmed: true,
      age: 30,
      emailConfirmCode: null,
      photoUrl: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      parentProfile: {
        id: "parent-1" as Ids.ParentId,
      },
      traineeProfile: {
        id: "trainee-1" as Ids.TraineeId,
        userId: "user-1",
        isOnboardingCompleted: true,
        unregisteredTraineeId: null,
        groups: [{ id: "group-1" as Ids.GroupId }],
      },
    };

    parent = new MarkAttendanceByNotTrainerParent(db, user);
  });

  describe("exec", () => {
    it("should throw BadRequestException when children info is not provided", async () => {
      const command: MarkAttendanceByNotTrainerCommand = {
        trainerUsername: "trainer1" as Ids.TrainerUsername,
        trainerQrCodeKey: "qr-key",
        username: "user1" as Ids.Username,
        childrenAndTrainings: null,
      };

      await expect(parent.exec(command)).rejects.toThrow(BadRequestException);
    });

    it("should throw BadRequestException when some children have trainingId and others don't", async () => {
      const command: MarkAttendanceByNotTrainerCommand = {
        trainerUsername: "trainer1" as Ids.TrainerUsername,
        trainerQrCodeKey: "qr-key",
        username: "user1" as Ids.Username,
        childrenAndTrainings: [
          {
            traineeId: "trainee-1" as Ids.TraineeId,
            trainingId: "training-1" as Ids.TrainingId,
          },
          { traineeId: "trainee-2" as Ids.TraineeId },
        ],
      };

      await expect(parent.exec(command)).rejects.toThrow(BadRequestException);
    });

    it("should throw BadRequestException when children are not linked to parent", async () => {
      const command: MarkAttendanceByNotTrainerCommand = {
        trainerUsername: "trainer1" as Ids.TrainerUsername,
        trainerQrCodeKey: "qr-key",
        username: "user1" as Ids.Username,
        childrenAndTrainings: [
          {
            traineeId: "trainee-1" as Ids.TraineeId,
            trainingId: "training-1" as Ids.TrainingId,
          },
        ],
      };

      jest.spyOn(db.parentTraineeLink, "findMany").mockResolvedValue([]);

      await expect(parent.exec(command)).rejects.toThrow(BadRequestException);
    });

    it("should throw BadRequestException when not all children are trainee", async () => {
      const command: MarkAttendanceByNotTrainerCommand = {
        trainerUsername: "trainer1" as Ids.TrainerUsername,
        trainerQrCodeKey: "qr-key",
        username: "user1" as Ids.Username,
        childrenAndTrainings: [
          {
            traineeId: "trainee-1" as Ids.TraineeId,
            trainingId: "training-1" as Ids.TrainingId,
          },
          {
            traineeId: "trainee-2" as Ids.TraineeId,
            trainingId: "training-2" as Ids.TrainingId,
          },
        ],
      };

      jest.spyOn(db.traineeProfile, "findMany").mockResolvedValue([
        {
          id: "trainee-1" as Ids.TraineeId,
          userId: "user-1" as Ids.UserId,
          isOnboardingCompleted: true,
          unregisteredTraineeId: null,
        },
      ]);

      await expect(parent.exec(command)).rejects.toThrow(BadRequestException);
    });

    it("should successfully mark attendance for valid children", async () => {
      const command: MarkAttendanceByNotTrainerCommand = {
        trainerUsername: "trainer1" as Ids.TrainerUsername,
        trainerQrCodeKey: "qr-key",
        username: "user1" as Ids.Username,
        childrenAndTrainings: [
          {
            traineeId: "trainee-1" as Ids.TraineeId,
            trainingId: "training-1" as Ids.TrainingId,
          },
          {
            traineeId: "trainee-2" as Ids.TraineeId,
            trainingId: "training-2" as Ids.TrainingId,
            subscriptionTraineeId: "sub-2" as Ids.SubscriptionTraineeId,
          },
        ],
      };

      // Mock parent-trainee link
      jest.spyOn(db.parentTraineeLink, "findMany").mockResolvedValue([
        {
          id: "parent-trainee-link-1" as Ids.ParentTraineeLinkId,
          traineeId: "trainee-1" as Ids.TraineeId,
          parentId: "parent-1" as Ids.ParentId,
        },
        {
          id: "parent-trainee-link-2" as Ids.ParentTraineeLinkId,
          traineeId: "trainee-2" as Ids.TraineeId,
          parentId: "parent-1" as Ids.ParentId,
        },
      ]);

      jest.spyOn(db.training, "findMany").mockResolvedValue([
        {
          id: "training-1",
          groupId: "group-1",
          type: TrainingType.GROUP,
          name: "Training 1",
          gymId: "gym-1",
          startDate: new Date(),
          durationMin: 60,
          templateId: "template-1",
          price: 100,
        },
        {
          id: "training-2",
          groupId: "group-2",
          type: TrainingType.GROUP,
          name: "Training 2",
          gymId: "gym-2",
          startDate: new Date(),
          durationMin: 60,
          templateId: "template-2",
          price: 100,
        },
      ]);

      // Mock no existing attendances
      jest.spyOn(db.attendance, "findMany").mockResolvedValue([]);

      jest.spyOn(db.subscriptionTrainee, "findMany").mockResolvedValue([]);
      jest.spyOn(db.subscriptionTrainee, "findUnique").mockResolvedValue({
        id: "sub-2" as Ids.SubscriptionTraineeId,
        traineeId: "trainee-2" as Ids.TraineeId,
        subscriptionId: "sub-2" as Ids.SubscriptionId,
        createdAt: new Date(),
        updatedAt: new Date(),
        paymentId: "payment-2",
        isPaid: true,
        trainingsLeft: 10,
        validUntil: new Date(),
        activationType: SubscriptionActivationType.WHEN_TRAINING_ATTENDED,
        activeFromDate: new Date(),
      });
      jest.spyOn(db.group, "update").mockResolvedValue(null);
      jest.spyOn(db.attendance, "create").mockResolvedValue(null);

      // Mock trainee profile
      jest.spyOn(db.traineeProfile, "findMany").mockResolvedValue([
        {
          id: "trainee-1" as Ids.TraineeId,
          userId: "user-1" as Ids.UserId,
          isOnboardingCompleted: true,
          unregisteredTraineeId: null,
        },
        {
          id: "trainee-2" as Ids.TraineeId,
          userId: "user-1" as Ids.UserId,
          isOnboardingCompleted: true,
          unregisteredTraineeId: null,
        },
      ]);

      // Mock training
      jest.spyOn(db.training, "findUnique").mockResolvedValue({
        id: "training-1",
        groupId: "group-1",
        type: TrainingType.GROUP,
        startDate: new Date(),
        durationMin: 60,
        name: "Training 1",
        gymId: "gym-1",
        templateId: "template-1",
        price: 100,
      });

      const result = await parent.exec(command);

      expect(result).toEqual({
        status: ScanTrainerQRCodeStatus.success,
      });

      expect(db.attendance.create).toHaveBeenCalledTimes(
        command.childrenAndTrainings.length,
      );
    });

    it("should skip already marked attendance", async () => {
      const markedChild: MarkAttendanceByNotTrainerCommand["childrenAndTrainings"][number] =
        {
          traineeId: "trainee-1" as Ids.TraineeId,
          subscriptionTraineeId: "sub-1" as Ids.SubscriptionTraineeId,
        };

      const notMarkedChild: MarkAttendanceByNotTrainerCommand["childrenAndTrainings"][number] =
        {
          traineeId: "trainee-2" as Ids.TraineeId,
        };

      const command: MarkAttendanceByNotTrainerCommand = {
        trainerUsername: "trainer1" as Ids.TrainerUsername,
        trainerQrCodeKey: "qr-key",
        username: "user1" as Ids.Username,
        childrenAndTrainings: [markedChild, notMarkedChild],
      };

      jest.spyOn(db.training, "findMany").mockResolvedValue([
        {
          id: "training-1",
          groupId: "group-1",
          type: TrainingType.GROUP,
          name: "Training 1",
          gymId: "gym-1",
          startDate: new Date(),
          durationMin: 60,
          templateId: "template-1",
          price: 100,
        },
      ]);

      jest.spyOn(db.parentTraineeLink, "findMany").mockResolvedValue([
        {
          id: "parent-trainee-link-1" as Ids.ParentTraineeLinkId,
          traineeId: "trainee-1" as Ids.TraineeId,
          parentId: "parent-1" as Ids.ParentId,
        },
        {
          id: "parent-trainee-link-2" as Ids.ParentTraineeLinkId,
          traineeId: "trainee-2" as Ids.TraineeId,
          parentId: "parent-1" as Ids.ParentId,
        },
      ]);

      jest.spyOn(db.attendance, "findMany").mockResolvedValue([
        {
          id: "attendance-1" as Ids.AttendanceId,
          traineeId: "trainee-1" as Ids.TraineeId,
          trainingId: "training-1" as Ids.TrainingId,
          status: AttendanceStatus.PRESENT,
          markedAt: new Date(),
          createdByUserId: "user-1" as Ids.UserId,
          paymentId: "payment-1",
          markedAsPaidByTrainerId: "trainer-1" as Ids.TrainerId,
          subscriptionTraineeId: "sub-1" as Ids.SubscriptionTraineeId,
          unregisteredTraineeId: null,
        },
      ]);

      jest.spyOn(db.traineeProfile, "findMany").mockResolvedValue([
        {
          id: "trainee-2" as Ids.TraineeId,
          userId: "user-2" as Ids.UserId,
          isOnboardingCompleted: true,
          unregisteredTraineeId: null,
        },
      ]);

      jest.spyOn(db.training, "findUnique").mockResolvedValue({
        id: "training-1",
        groupId: "group-1",
        type: TrainingType.GROUP,
        startDate: new Date(),
        durationMin: 60,
        name: "Training 1",
        gymId: "gym-1",
        templateId: "template-1",
        price: 100,
      });

      jest.spyOn(db.subscriptionTrainee, "findMany").mockResolvedValue([]);
      jest.spyOn(db.group, "update").mockResolvedValue(null);
      jest.spyOn(db.attendance, "create").mockResolvedValue(null);

      const result = await parent.exec(command);

      expect(result).toEqual({
        status: ScanTrainerQRCodeStatus.success,
      });
      expect(db.attendance.create).toHaveBeenCalledTimes(
        command.childrenAndTrainings.length - 1,
      );
    });
  });
});
