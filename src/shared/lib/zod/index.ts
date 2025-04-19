import { z, ZodTypeAny } from "zod";

export { ZodInterceptor } from "./zod.interceptor";
export { ZodPipe } from "./zod.pipe";
export { ResponseValidation } from "./response-validation.decorator";
export type InferSchema<T> = T extends ZodTypeAny ? z.infer<T> : never;
