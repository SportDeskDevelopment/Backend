import { Inject, Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { envConfig, EnvConfig } from "../../config/config.env";
import { JwtPayload } from "../../common/types/jwt-payload";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(@Inject(envConfig.KEY) config: EnvConfig) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.jwtSecret,
    });
  }

  async validate(payload: JwtPayload): Promise<JwtPayload> {
    return {
      id: payload.id,
      email: payload.email,
      roles: payload.roles,
      preferredLang: payload.preferredLang,
    };
  }
}
