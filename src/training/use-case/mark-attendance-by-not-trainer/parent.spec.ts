import { BadRequestException } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { MarkAttendanceByNotTrainerParent } from "./parent";
import { Ids } from "../../../kernel/ids";
import { ScanTrainerQRCodeStatus } from "./constants";
import {
  AttendanceStatus,
  TrainingType,
  SubscriptionActivationType,
} from "@prisma/client";
import { MarkAttendanceByNotTrainerCommand } from "./types";

describe("MarkAttendanceByNotTrainerParent", () => {
  let service: MarkAttendanceByNotTrainerParent;
  let prisma: PrismaService;

  beforeEach(() => {
    prisma = new PrismaService();
    service = new MarkAttendanceByNotTrainerParent(prisma);
  });

  afterEach(async () => {
    await prisma.attendance.deleteMany();
    await prisma.subscriptionTrainee.deleteMany();
    await prisma.training.deleteMany();
    await prisma.parentTraineeLink.deleteMany();
  });

  describe("exec", () => {
    it("Trainee > ", async () => {
      const command: MarkAttendanceByNotTrainerCommand = {
        trainerQrCodeKey: "key",
        trainerUsername: "trainer" as Ids.TrainerUsername,
        username: "parent" as Ids.Username,
      };

      await expect(service.exec(command)).rejects.toThrow(BadRequestException);
    });

    it("Parent > should throw error when some children have trainingId and some don't", async () => {
      const command: MarkAttendanceByNotTrainerCommand = {
        trainerQrCodeKey: "key",
        trainerUsername: "trainer" as Ids.TrainerUsername,
        username: "parent" as Ids.Username,
        childrenTrainings: [
          {
            childId: "child-1" as Ids.ParentTraineeLinkId,
            trainingId: "training-1" as Ids.TrainingId,
          },
          {
            childId: "child-2" as Ids.ParentTraineeLinkId,
          },
        ],
      };

      await expect(service.exec(command)).rejects.toThrow(BadRequestException);
    });

    it("Parent > should throw error when invalid child id is provided", async () => {
      const command: MarkAttendanceByNotTrainerCommand = {
        trainerQrCodeKey: "key",
        trainerUsername: "trainer" as Ids.TrainerUsername,
        username: "parent" as Ids.Username,
        childrenTrainings: [
          {
            childId: "child-1" as Ids.ParentTraineeLinkId,
            trainingId: "training-1" as Ids.TrainingId,
          },
          {
            childId: "child-2" as Ids.ParentTraineeLinkId,
            trainingId: "training-1" as Ids.TrainingId,
          },
        ],
      };

      jest.spyOn(prisma.parentTraineeLink, "findMany").mockResolvedValue([
        {
          id: "child-1" as Ids.ParentTraineeLinkId,
          parentId: "parent-1",
          traineeId: "trainee-1",
        },
      ]);

      await expect(service.exec(command)).rejects.toThrow(BadRequestException);
    });

    it("Parent > should return success status when we pass trainingId and subscriptionTraineeId", async () => {
      const command = {
        trainerQrCodeKey: "key",
        trainerUsername: "trainer" as Ids.TrainerUsername,
        childrenTrainings: [
          {
            childId: "child-1" as Ids.ParentTraineeLinkId,
            trainingId: "training-1" as Ids.TrainingId,
            subscriptionTraineeId: "sub-1" as Ids.SubscriptionTraineeId,
          },
        ],
      };

      jest.spyOn(prisma.parentTraineeLink, "findMany").mockResolvedValue([
        {
          id: "child-1" as Ids.ParentTraineeLinkId,
          parentId: "parent-1",
          traineeId: "trainee-1",
        },
      ]);

      jest.spyOn(prisma.training, "findMany").mockResolvedValue([
        {
          id: "training-1" as Ids.TrainingId,
          name: "Training 1",
          type: TrainingType.GROUP,
          startDate: new Date(),
          durationMin: 60,
          gymId: "gym-1",
          groupId: "group-1" as Ids.GroupId,
          templateId: "template-1",
          price: 100,
        },
      ]);

      jest.spyOn(prisma.training, "findUnique").mockResolvedValue({
        id: "training-1" as Ids.TrainingId,
        name: "Training 1",
        type: TrainingType.GROUP,
        startDate: new Date(),
        durationMin: 60,
        gymId: "gym-1",
        groupId: "group-1" as Ids.GroupId,
        templateId: "template-1",
        price: 100,
      });

      jest.spyOn(prisma.subscriptionTrainee, "findMany").mockResolvedValue([
        {
          id: "sub-1" as Ids.SubscriptionTraineeId,
          traineeId: "trainee-1",
          subscriptionId: "subscription-1",
          isPaid: true,
          trainingsLeft: 10,
          paymentId: "payment-1",
          validUntil: new Date(),
          activeFromDate: new Date(),
          activationType: SubscriptionActivationType.WHEN_TRAINING_ATTENDED,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);

      jest.spyOn(prisma.attendance, "create").mockResolvedValue({
        id: "attendance-1",
        trainingId: "training-1",
        traineeId: "trainee-1",
        status: AttendanceStatus.PRESENT,
        unregisteredTraineeId: null,
        markedAt: new Date(),
        createdByUserId: "user-1",
        subscriptionTraineeId: "sub-1",
        paymentId: null,
        markedAsPaidByTrainerId: null,
      });

      const result = await service.exec(command);

      expect(result).toEqual({
        status: ScanTrainerQRCodeStatus.success,
      });
    }, 10000);

    it("Parent > should return already marked status when attendance exists", async () => {
      const command = {
        trainerQrCodeKey: "key",
        trainerUsername: "trainer" as Ids.TrainerUsername,
        childrenTrainings: [
          {
            childId: "child-1" as Ids.ParentTraineeLinkId,
            trainingId: "training-1" as Ids.TrainingId,
          },
        ],
      };

      jest.spyOn(prisma.parentTraineeLink, "findMany").mockResolvedValue([
        {
          id: "child-1" as Ids.ParentTraineeLinkId,
          parentId: "parent-1",
          traineeId: "trainee-1",
        },
      ]);

      jest.spyOn(prisma.attendance, "findMany").mockResolvedValue([
        {
          id: "attendance-1",
          trainingId: "training-1",
          traineeId: "trainee-1",
          status: AttendanceStatus.PRESENT,
          unregisteredTraineeId: null,
          markedAt: new Date(),
          createdByUserId: "user-1",
          subscriptionTraineeId: null,
          paymentId: null,
          markedAsPaidByTrainerId: null,
        },
      ]);

      const result = await service.exec(command);

      expect(result).toEqual({
        status: ScanTrainerQRCodeStatus.alreadyMarked,
      });
    });
  });
});
