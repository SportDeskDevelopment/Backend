import * as DB from "@prisma/client";
import { UserId } from "../../kernel/ids/ids";

export type JwtPayload = {
  id: UserId;
  email: string;
  preferredLang?: string;
  roles?: DB.RoleType[];
};
