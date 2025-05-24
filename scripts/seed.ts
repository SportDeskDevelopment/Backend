import {
  PrismaClient,
  RoleType,
  PlanType,
  TrainingType,
  WeekDay,
  SubscriptionType,
  SubscriptionTrainingType,
} from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("123", 10);

  // Create users
  const adminUser = await prisma.user.create({
    data: {
      email: "admin@example.com",
      firstName: "Admin",
      username: "adminUsername",
      passwordHash,
      isEmailConfirmed: true,
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
      firstName: "Trainer",
      username: "trainerUsername",
      passwordHash,
      roles: [RoleType.TRAINER],
      isEmailConfirmed: true,
      trainerProfile: {
        create: {
          id: "cm9svevvc0003ud5k913mldd4",
          currentPlan: PlanType.PREMIUM,
          planStartedAt: new Date(),
          planUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
          qrCodeKey: "123",
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
      firstName: "Trainee",
      username: "traineeUsername",
      passwordHash,
      isEmailConfirmed: true,
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
      firstName: "Parent",
      username: "parentUsername",
      passwordHash,
      isEmailConfirmed: true,
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
      name: "Monthly Subscription",
      createdBy: {
        connect: {
          id: trainerUser.trainerProfile!.id,
        },
      },
      maxTrainings: 12,
      type: SubscriptionType.PERIOD,
      trainingType: SubscriptionTrainingType.GROUP_AND_INDIVIDUAL,
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
      createdBy: {
        connect: {
          id: trainerUser.id,
        },
      },
    },
  });

  const traineeSubscription = await prisma.subscription.create({
    data: {
      name: "Trainee Monthly Plan",
      createdById: trainerUser.trainerProfile!.id,
      type: SubscriptionType.PERIOD,
      maxTrainings: 8,
      price: 50,
      isPublic: true,
    },
  });

  // 🔗 Link trainee to subscription
  const subscriptionTrainee = await prisma.subscriptionTrainee.create({
    data: {
      subscriptionId: traineeSubscription.id,
      traineeId: traineeUser.traineeProfile!.id,
      activeFromDate: new Date(),
      isPaid: true,
    },
  });

  // Attendance using subscription
  await prisma.attendance.create({
    data: {
      traineeId: traineeUser.traineeProfile!.id,
      trainingId: training.id,
      createdByUserId: trainerUser.id,
      subscriptionTraineeId: subscriptionTrainee.id,
    },
  });

  // 👥 Create unregistered trainees
  const [unreg1, unreg2, unreg3] = await Promise.all([
    prisma.unregisteredTrainee.create({
      data: {
        firstName: "Unregistered One",
        trainerId: trainerUser.trainerProfile!.id,
      },
    }),
    prisma.unregisteredTrainee.create({
      data: {
        firstName: "Unregistered Two",
        trainerId: trainerUser.trainerProfile!.id,
      },
    }),
    prisma.unregisteredTrainee.create({
      data: {
        firstName: "Unregistered Three",
        trainerId: trainerUser.trainerProfile!.id,
      },
    }),
  ]);

  // 📋 Отметить их на тренировке
  await prisma.attendance.createMany({
    data: [
      {
        unregisteredTraineeId: unreg1.id,
        trainingId: training.id,
        createdByUserId: trainerUser.id,
      },
      {
        unregisteredTraineeId: unreg2.id,
        trainingId: training.id,
        createdByUserId: trainerUser.id,
      },
      {
        unregisteredTraineeId: unreg3.id,
        trainingId: training.id,
        createdByUserId: trainerUser.id,
      },
    ],
  });

  //Default Trainer Limits
  await prisma.defaultTrainerLimits.create({
    data: {
      maxTrainees: 20,
      maxGroups: 3,
      maxGyms: 1,
      maxSubscriptions: 3,
      type: PlanType.FREE,
    },
  });

  // Seed Social Networks
  const socialNetworks = [
    { name: "Instagram", icon: "instagram-icon.svg" },
    { name: "X (Twitter)", icon: "twitter-icon.svg" },
    { name: "Facebook", icon: "facebook-icon.svg" },
    { name: "Telegram", icon: "telegram-icon.svg" },
    { name: "TikTok", icon: "tiktok-icon.svg" },
    { name: "LinkedIn", icon: "linkedin-icon.svg" },
  ];

  for (const social of socialNetworks) {
    await prisma.socialNetwork.upsert({
      where: { name: social.name },
      update: { icon: social.icon },
      create: {
        name: social.name,
        icon: social.icon,
      },
    });
  }
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
