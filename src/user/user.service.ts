import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { LangCode } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { UserDto } from "./dto";
import { Ids } from "../kernel/ids";

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

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
      },
    });

    if (!user) {
      throw new NotFoundException("User not found");
    }

    return user;
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
}
