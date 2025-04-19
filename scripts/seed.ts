import {
  PrismaClient,
  RoleType,
  PlanType,
  TrainingType,
  WeekDay,
} from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("123", 10);

  // Create users
  const adminUser = await prisma.user.create({
    data: {
      email: "admin@example.com",
      name: "Admin User",
      username: "adminUsername",
      passwordHash,
      roles: [RoleType.ADMIN],
      adminProfile: {
        create: {},
      },
    },
    include: {
      adminProfile: true,
    },
  });

  const trainerUser = await prisma.user.create({
    data: {
      email: "trainer@example.com",
      name: "Trainer User",
      username: "trainerUsername",
      passwordHash,
      roles: [RoleType.TRAINER],
      trainerProfile: {
        create: {
          currentPlan: PlanType.PREMIUM,
          planStartedAt: new Date(),
          planUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
          limits: {
            create: {
              maxTrainees: 50,
              maxGroups: 10,
              maxGyms: 5,
              maxTemplates: 20,
            },
          },
        },
      },
    },
    include: {
      trainerProfile: true,
    },
  });

  const traineeUser = await prisma.user.create({
    data: {
      email: "trainee@example.com",
      name: "Trainee User",
      username: "traineeUsername",
      passwordHash,
      roles: [RoleType.TRAINEE],
      traineeProfile: {
        create: {},
      },
    },
    include: {
      traineeProfile: true,
    },
  });

  const parentUser = await prisma.user.create({
    data: {
      email: "parent@example.com",
      name: "Parent User",
      username: "parentUsername",
      passwordHash,
      roles: [RoleType.PARENT],
      parentProfile: {
        create: {},
      },
    },
    include: {
      parentProfile: true,
    },
  });

  // Create gym
  const gym = await prisma.gym.create({
    data: {
      name: "Main Gym",
      address: "123 Main St",
      geoLat: 50.4501,
      geoLng: 30.5234,
      workHours: "Mon-Fri: 8:00-22:00, Sat-Sun: 9:00-20:00",
      trainers: {
        connect: {
          id: trainerUser.trainerProfile!.id,
        },
      },
      admins: {
        connect: {
          id: adminUser.adminProfile!.id,
        },
      },
    },
  });

  // Create group
  const group = await prisma.group.create({
    data: {
      name: "Beginner Group",
      gym: {
        connect: {
          id: gym.id,
        },
      },
      trainees: {
        connect: {
          id: traineeUser.traineeProfile!.id,
        },
      },
      trainers: {
        connect: {
          id: trainerUser.trainerProfile!.id,
        },
      },
    },
  });

  // Create training template
  const template = await prisma.trainingTemplate.create({
    data: {
      trainingName: "Morning Workout",
      durationMin: 60,
      type: TrainingType.GROUP,
      startDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // 90 days ago
      endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
      group: {
        connect: {
          id: group.id,
        },
      },
      trainer: {
        connect: {
          id: trainerUser.trainerProfile!.id,
        },
      },
      gym: {
        connect: {
          id: gym.id,
        },
      },
      timeSlots: {
        create: [
          {
            dayOfWeek: WeekDay.MONDAY,
            hours: 9,
            minutes: 0,
          },
          {
            dayOfWeek: WeekDay.WEDNESDAY,
            hours: 9,
            minutes: 0,
          },
          {
            dayOfWeek: WeekDay.FRIDAY,
            hours: 9,
            minutes: 0,
          },
        ],
      },
    },
  });

  // Create subscription
  await prisma.subscription.create({
    data: {
      trainee: {
        connect: {
          id: traineeUser.traineeProfile!.id,
        },
      },
      createdBy: {
        connect: {
          id: trainerUser.trainerProfile!.id,
        },
      },
      maxTrainings: 12,
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      type: "PERIOD",
    },
  });

  // Link parent with trainee
  await prisma.parentTraineeLink.create({
    data: {
      parent: {
        connect: {
          id: parentUser.parentProfile!.id,
        },
      },
      trainee: {
        connect: {
          id: traineeUser.traineeProfile!.id,
        },
      },
    },
  });

  // Create training from template
  const training = await prisma.training.create({
    data: {
      name: template.trainingName,
      type: template.type,
      startDate: new Date(),
      durationMin: template.durationMin,
      gym: {
        connect: {
          id: gym.id,
        },
      },
      group: {
        connect: {
          id: group.id,
        },
      },
      template: {
        connect: {
          id: template.id,
        },
      },
      trainers: {
        connect: {
          id: trainerUser.trainerProfile!.id,
        },
      },
    },
  });

  // Create attendance for training
  await prisma.attendance.create({
    data: {
      trainee: {
        connect: {
          id: traineeUser.traineeProfile!.id,
        },
      },
      training: {
        connect: {
          id: training.id,
        },
      },
      scannedBy: {
        connect: {
          id: trainerUser.id,
        },
      },
    },
  });

  console.log("Seed data created successfully");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
