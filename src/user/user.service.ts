import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { LangCode, RoleType } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { UserDto } from "./dto";
import { Ids } from "../kernel/ids";
import { Prisma } from "@prisma/client";

type SelectedUser = Prisma.UserGetPayload<{
  select: {
    id: true;
    username: true;
    email: true;
    roles: true;
    name: true;
    preferredLang: true;
    activeRole: true;
    trainerProfile: {
      select: {
        gyms: true;
        groups: true;
        trainings: true;
        isOnboardingCompleted: true;
        subscriptions: true;
        publicContact: true;
      };
    };
    traineeProfile: {
      select: {
        isOnboardingCompleted: true;
      };
    };
    parentProfile: {
      select: {
        trainees: true;
        isOnboardingCompleted: true;
      };
    };
  };
}>;

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  private readonly OnboardingStep = {
    GYM_CREATION: "gym-creation",
    GROUP_CREATION: "group-creation",
    SUBSCRIPTION_CREATION: "subscription-creation",
    TRAINING_CREATION: "training-creation",
    CONTACT_INFORMATION_CREATION: "contact-information-creation",
    TRAINEE_CREATION: "trainee-creation",
  } as const;

  async getCurrentUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        email: true,
        roles: true,
        name: true,
        preferredLang: true,
        activeRole: true,
        trainerProfile: {
          select: {
            gyms: true,
            groups: true,
            trainings: true,
            isOnboardingCompleted: true,
            subscriptions: true,
            publicContact: true,
          },
        },
        traineeProfile: {
          select: {
            isOnboardingCompleted: true,
          },
        },
        parentProfile: {
          select: {
            trainees: true,
            isOnboardingCompleted: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException("User not found");
    }

    return {
      ...user,
      ...this.checkOnboardingStatus(user),
    };
  }

  async updateLanguage(userId: string, dto: UserDto.UpdateLanguageRequest) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { preferredLang: this.mapLangCode(dto.preferredLang) },
    });

    return { message: "Language updated successfully" };
  }

  async updateActiveRole(userId: string, dto: UserDto.UpdateRoleRequest) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId },
    });

    if (!user.roles.includes(dto.role)) {
      throw new ForbiddenException("User does not have this role");
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { activeRole: dto.role },
    });

    return { message: "Role updated successfully" };
  }

  async validateUser({
    username,
    id,
    email,
  }: {
    username?: string;
    id?: Ids.UserId;
    email?: string;
  }) {
    const user = await this.prisma.user.findFirst({
      where: { OR: [{ username }, { id }, { email }] },
    });

    if (!user) {
      throw new NotFoundException("User not found");
    }

    return user;
  }

  private mapLangCode(
    lang: UserDto.UpdateLanguageRequestPreferredLang,
  ): LangCode {
    return {
      en: LangCode.EN,
      ua: LangCode.UA,
      pl: LangCode.PL,
    }[lang];
  }

  private async checkOnboardingStatus(user: SelectedUser) {
    const trainerStepsLeft: string[] = [];
    const traineeStepsLeft: string[] = [];
    const parentStepsLeft: string[] = [];

    const { roles, trainerProfile, traineeProfile, parentProfile } = user;

    if (!trainerProfile && !traineeProfile && !parentProfile) {
      return;
    }

    if (
      roles.includes(RoleType.TRAINER) &&
      !trainerProfile?.isOnboardingCompleted
    ) {
      if (!trainerProfile.gyms?.length) {
        trainerStepsLeft.push(this.OnboardingStep.GYM_CREATION);
      }

      if (!trainerProfile.groups?.length) {
        trainerStepsLeft.push(this.OnboardingStep.GROUP_CREATION);
      }

      if (!trainerProfile.trainings?.length) {
        trainerStepsLeft.push(this.OnboardingStep.TRAINING_CREATION);
      }

      if (!trainerProfile.subscriptions?.length) {
        trainerStepsLeft.push(this.OnboardingStep.SUBSCRIPTION_CREATION);
      }

      if (!trainerProfile.publicContact) {
        trainerStepsLeft.push(this.OnboardingStep.CONTACT_INFORMATION_CREATION);
      }
    }

    if (
      roles.includes(RoleType.PARENT) &&
      !parentProfile?.isOnboardingCompleted
    ) {
      if (!parentProfile.trainees?.length) {
        parentStepsLeft.push(this.OnboardingStep.TRAINEE_CREATION);
      }
    }

    return {
      trainerOnboardingLeft: trainerStepsLeft,
      traineeOnboardingLeft: traineeStepsLeft,
      parentOnboardingLeft: parentStepsLeft,
    };
  }
}
