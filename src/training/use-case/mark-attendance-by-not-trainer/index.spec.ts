import { BadRequestException, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { MarkAttendanceByNotTrainerUseCase } from "./index";
import { Ids } from "../../../kernel/ids";
import { LangCode, RoleType } from "@prisma/client";
import { MarkAttendanceByNotTrainerCommand, UserInCommand } from "./types";

describe("MarkAttendanceByNotTrainerUseCase", () => {
  let service: MarkAttendanceByNotTrainerUseCase;
  let prisma: PrismaService;

  beforeEach(() => {
    prisma = new PrismaService();
    service = new MarkAttendanceByNotTrainerUseCase(prisma);
  });

  describe("exec", () => {
    it("should throw BadRequestException when username is not provided", async () => {
      const command: MarkAttendanceByNotTrainerCommand = {
        trainerQrCodeKey: "key",
        trainerUsername: "trainer" as Ids.TrainerUsername,
        username: "" as Ids.Username,
      };

      await expect(service.exec(command)).rejects.toThrow(BadRequestException);
    });

    it("should throw BadRequestException when user is not a trainee or parent", async () => {
      const command: MarkAttendanceByNotTrainerCommand = {
        trainerQrCodeKey: "key",
        trainerUsername: "trainer" as Ids.TrainerUsername,
        username: "user" as Ids.Username,
      };

      jest.spyOn(prisma.user, "findUnique").mockResolvedValue({
        id: "user-1",
        username: "user",
        email: "user@example.com",
        name: "Test User",
        roles: [RoleType.ADMIN],
        traineeProfile: null,
        parentProfile: null,
        passwordHash: "hash",
        googleId: null,
        preferredLang: "EN",
        activeRole: RoleType.ADMIN,
        isEmailConfirmed: true,
        age: 20,
        emailConfirmCode: null,
        photoUrl: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await expect(service.exec(command)).rejects.toThrow(BadRequestException);
    });

    it("should throw NotFoundException when trainer is not found", async () => {
      const command: MarkAttendanceByNotTrainerCommand = {
        trainerQrCodeKey: "key",
        trainerUsername: "trainer" as Ids.TrainerUsername,
        username: "trainee" as Ids.Username,
      };

      const mockUser: UserInCommand = {
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
        parentProfile: { id: "parent-1" },
        passwordHash: "hash",
        googleId: null,
        preferredLang: LangCode.EN,
        activeRole: RoleType.TRAINEE,
        isEmailConfirmed: true,
        age: 20,
        emailConfirmCode: null,
        photoUrl: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      jest.spyOn(prisma.user, "findUnique").mockResolvedValue(mockUser);
      jest.spyOn(prisma.trainerProfile, "findFirst").mockResolvedValue(null);

      await expect(service.exec(command)).rejects.toThrow(NotFoundException);
    });

    it("should throw BadRequestException when QR code is invalid", async () => {
      const command: MarkAttendanceByNotTrainerCommand = {
        trainerQrCodeKey: "invalid-key",
        trainerUsername: "trainer" as Ids.TrainerUsername,
        username: "trainee" as Ids.Username,
      };

      const mockUser: UserInCommand = {
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
        parentProfile: { id: "parent-1" },
        passwordHash: "hash",
        googleId: null,
        preferredLang: LangCode.EN,
        activeRole: RoleType.TRAINEE,
        isEmailConfirmed: true,
        age: 20,
        emailConfirmCode: null,
        photoUrl: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      jest.spyOn(prisma.user, "findUnique").mockResolvedValue(mockUser);
      jest.spyOn(prisma.trainerProfile, "findFirst").mockResolvedValue({
        id: "trainer-1",
        userId: "trainer-user-1",
        qrCodeKey: "valid-key",
      } as any);

      await expect(service.exec(command)).rejects.toThrow(BadRequestException);
    });

    it("should throw NotFoundException when training is not found", async () => {
      const command: MarkAttendanceByNotTrainerCommand = {
        trainerQrCodeKey: "key",
        trainerUsername: "trainer" as Ids.TrainerUsername,
        username: "trainee" as Ids.Username,
        trainingId: "non-existent" as Ids.TrainingId,
      };

      const mockUser: UserInCommand = {
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
        parentProfile: { id: "parent-1" },
        passwordHash: "hash",
        googleId: null,
        preferredLang: "EN",
        activeRole: RoleType.TRAINEE,
        isEmailConfirmed: true,
        age: 20,
        emailConfirmCode: null,
        photoUrl: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      jest.spyOn(prisma.user, "findUnique").mockResolvedValue(mockUser);
      jest.spyOn(prisma.trainerProfile, "findFirst").mockResolvedValue({
        id: "trainer-1",
        userId: "trainer-user-1",
        qrCodeKey: "key",
      } as any);
      jest.spyOn(prisma.training, "findUnique").mockResolvedValue(null);

      await expect(service.exec(command)).rejects.toThrow(NotFoundException);
    });

    it("should throw NotFoundException when subscription trainee is not found", async () => {
      const command: MarkAttendanceByNotTrainerCommand = {
        trainerQrCodeKey: "key",
        trainerUsername: "trainer" as Ids.TrainerUsername,
        username: "trainee" as Ids.Username,
        subscriptionTraineeId: "non-existent" as Ids.SubscriptionTraineeId,
      };

      const mockUser: UserInCommand = {
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
        parentProfile: { id: "parent-1" },
        passwordHash: "hash",
        googleId: null,
        preferredLang: "EN",
        activeRole: RoleType.TRAINEE,
        isEmailConfirmed: true,
        age: 20,
        emailConfirmCode: null,
        photoUrl: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      jest.spyOn(prisma.user, "findUnique").mockResolvedValue(mockUser);
      jest.spyOn(prisma.trainerProfile, "findFirst").mockResolvedValue({
        id: "trainer-1",
        userId: "trainer-user-1",
        qrCodeKey: "key",
      } as any);
      jest
        .spyOn(prisma.subscriptionTrainee, "findUnique")
        .mockResolvedValue(null);

      await expect(service.exec(command)).rejects.toThrow(NotFoundException);
    });

    it("should return trainerShouldNotMarkAttendance for trainer role", async () => {
      const command: MarkAttendanceByNotTrainerCommand = {
        trainerQrCodeKey: "key",
        trainerUsername: "trainer" as Ids.TrainerUsername,
        username: "trainer-user" as Ids.Username,
      };

      const mockUser: UserInCommand = {
        id: "user-1",
        username: "trainer-user",
        email: "trainer@example.com",
        name: "Test Trainer",
        roles: [RoleType.TRAINER],
        traineeProfile: null,
        parentProfile: { id: "parent-1" },
        passwordHash: "hash",
        googleId: null,
        preferredLang: "EN",
        activeRole: RoleType.TRAINER,
        isEmailConfirmed: true,
        age: 20,
        emailConfirmCode: null,
        photoUrl: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      jest.spyOn(prisma.user, "findUnique").mockResolvedValue(mockUser);
      jest.spyOn(prisma.trainerProfile, "findFirst").mockResolvedValue({
        id: "trainer-1",
        userId: "trainer-user-1",
        qrCodeKey: "key",
      } as any);

      const result = await service.exec(command);

      expect(result).toEqual({
        status: "trainerShouldNotMarkAttendance",
      });
    });

    it("should throw BadRequestException for unexpected role combination", async () => {
      const command: MarkAttendanceByNotTrainerCommand = {
        trainerQrCodeKey: "key",
        trainerUsername: "trainer" as Ids.TrainerUsername,
        username: "user" as Ids.Username,
      };

      const mockUser: UserInCommand = {
        id: "user-1",
        username: "user",
        email: "user@example.com",
        name: "Test User",
        roles: [RoleType.ADMIN, RoleType.SUPERADMIN],
        traineeProfile: {
          id: "trainee-1",
          userId: "user-1",
          groups: [{ id: "group-1" }],
          unregisteredTraineeId: null,
        },
        parentProfile: { id: "parent-1" },
        passwordHash: "hash",
        googleId: null,
        preferredLang: "EN",
        activeRole: RoleType.ADMIN,
        isEmailConfirmed: true,
        age: 20,
        emailConfirmCode: null,
        photoUrl: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      jest.spyOn(prisma.user, "findUnique").mockResolvedValue(mockUser);
      jest.spyOn(prisma.trainerProfile, "findFirst").mockResolvedValue({
        id: "trainer-1",
        userId: "trainer-user-1",
        qrCodeKey: "key",
      } as any);

      await expect(service.exec(command)).rejects.toThrow(BadRequestException);
    });
  });
});
