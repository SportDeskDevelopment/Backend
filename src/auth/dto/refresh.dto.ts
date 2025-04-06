import { z } from "zod";

export const RefreshDto = z.object({
  refreshToken: z.string(),
});

export type RefreshDto = z.infer<typeof RefreshDto>;
