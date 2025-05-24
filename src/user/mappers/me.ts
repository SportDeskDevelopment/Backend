import * as DB from "@prisma/client";
import { UserResponse } from "../dto/objects";
import { UserDto } from "../dto";

type UserWithProfile = DB.Prisma.UserGetPayload<{
  include: {
    trainerProfile: true;
    traineeProfile: true;
    parentProfile: true;
  };
}>;

export const mapUserToUserResponse = (
  user: UserWithProfile & {
    trainerStepsLeft?: string[] | null;
    traineeStepsLeft?: string[] | null;
    parentStepsLeft?: string[] | null;
  },
): UserResponse => ({
  id: user.id,
  email: user.email,
  firstName: user.firstName,
  lastName: user.lastName,
  preferredLang: user.preferredLang,
  activeRole: user.activeRole as UserDto.UserResponseActiveRole,
  roles: user.roles as UserDto.UserResponseRolesItem[],
  trainerStepsLeft: user.trainerStepsLeft ?? [],
  traineeStepsLeft: user.traineeStepsLeft ?? [],
  parentStepsLeft: user.parentStepsLeft ?? [],
  trainerProfile: user.trainerProfile ?? null,
  traineeProfile: user.traineeProfile ?? null,
  parentProfile: user.parentProfile ?? null,
});
