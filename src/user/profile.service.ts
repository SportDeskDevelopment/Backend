// import {
//   Injectable,
//   NotFoundException,
//   ForbiddenException,
// } from "@nestjs/common";
// import { PrismaService } from "../prisma/prisma.service";

// @Injectable()
// export class ProfileService {
//   constructor(private readonly prisma: PrismaService) {}

//   async getTrainerProfile(userId: string) {
//     const profile = await this.prisma.trainerProfile.findUnique({
//       where: { userId },
//     });

//     if (!profile) {
//       throw new NotFoundException("Trainer profile not found");
//     }

//     return profile;
//   }

//   async createTrainerProfile(
//     userId: string,
//     data: {
//       specialization: string;
//       experience: number;
//       description?: string;
//       achievements?: string[];
//     },
//   ) {
//     const existingProfile = await this.prisma.trainerProfile.findUnique({
//       where: { userId },
//     });

//     if (existingProfile) {
//       throw new ForbiddenException("Trainer profile already exists");
//     }

//     const profile = await this.prisma.trainerProfile.create({
//       data: {
//         userId,
//         ...data,
//       },
//     });

//     await this.prisma.userRole.update({
//       where: { id: userRole.id },
//       data: { hasProfile: true },
//     });

//     return profile;
//   }

//   async deleteTrainerProfile(userId: string) {
//     const profile = await this.prisma.trainerProfile.findUnique({
//       where: { userId },
//     });

//     if (!profile) {
//       throw new NotFoundException("Trainer profile not found");
//     }

//     const userRole = await this.prisma.userRole.findFirst({
//       where: {
//         userId,
//         type: "TRAINER",
//       },
//     });

//     await this.prisma.$transaction([
//       this.prisma.trainerProfile.delete({
//         where: { userId },
//       }),
//       this.prisma.userRole.update({
//         where: { id: userRole.id },
//         data: { hasProfile: false },
//       }),
//     ]);

//     return { message: "Trainer profile deleted successfully" };
//   }
// }
