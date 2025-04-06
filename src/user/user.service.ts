import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { LangCode } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { UserDto } from "./dto";

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async getCurrentUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { roles: true },
    });

    if (!user) {
      throw new NotFoundException("User not found");
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      preferredLang: user.preferredLang,
      activeRole: user.activeRole,
      roles: user.roles.map((role) => role.type),
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
    const userRole = await this.prisma.role.findFirst({
      where: { userId, type: dto.role },
    });

    if (!userRole) {
      throw new ForbiddenException("User does not have this role");
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { activeRole: dto.role },
    });

    return { message: "Role updated successfully" };
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
