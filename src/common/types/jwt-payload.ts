export type JwtPayload = {
  sub: string;
  email: string;
  preferredLang?: string;
  activeRole?: string;
};
