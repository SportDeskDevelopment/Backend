import { Reflector } from "@nestjs/core";
import type { RoleType } from "@prisma/client";

export const Roles = Reflector.createDecorator<RoleType[]>();
