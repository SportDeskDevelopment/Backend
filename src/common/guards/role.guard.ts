import { Injectable, CanActivate, ExecutionContext } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Roles } from "../decorators";
import { JwtPayload } from "../types/jwt-payload";
import { RoleType } from "@prisma/client";

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const roles = this.reflector.get(Roles, context.getHandler());
    if (!roles) {
      return true;
    }
    const request = context.switchToHttp().getRequest();
    const user = request.user as JwtPayload;
    if (user?.roles === undefined || user?.roles === null) return false;

    if (user.roles.includes(RoleType.SUPERADMIN)) return true;

    return roles.some((role) => user.roles.includes(role));
  }
}
