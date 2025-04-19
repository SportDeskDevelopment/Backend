import { UseInterceptors } from "@nestjs/common";
import { ZodTypeAny } from "zod";
import { ZodInterceptor } from "./zod.interceptor";

export const ResponseValidation = (schema: ZodTypeAny) => {
  return UseInterceptors(new ZodInterceptor(schema));
};
