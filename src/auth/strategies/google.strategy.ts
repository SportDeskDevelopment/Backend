import { Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { Strategy } from "passport-google-oauth20";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, "google") {
  constructor(private prisma: PrismaService) {
    super({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
      scope: ["email", "profile"],
    });
  }

  async validate(accessToken: string, refreshToken: string, profile: any) {
    const { id, emails, displayName } = profile;

    let user = await this.prisma.user.findFirst({
      where: {
        OR: [{ email: emails[0].value }, { googleId: id }],
      },
    });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          email: emails[0].value,
          name: displayName,
          googleId: id,
        },
      });
    } else if (!user.googleId) {
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: { googleId: id },
      });
    }

    return user;
  }
}
