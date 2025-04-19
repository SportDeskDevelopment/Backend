import { PipeTransform, BadRequestException } from "@nestjs/common";
import { ZodError, ZodSchema } from "zod";

export class ZodPipe implements PipeTransform {
  constructor(private schema: ZodSchema) {}

  transform(value: unknown) {
    try {
      const parsedValue = this.schema.parse(value);
      return parsedValue;
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.flatten().fieldErrors;
        throw new BadRequestException({
          message: "Validation failed",
          errors,
        });
      }
      throw new BadRequestException("Validation failed");
    }
  }
}
