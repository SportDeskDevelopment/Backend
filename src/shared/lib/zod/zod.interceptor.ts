import cuid from "cuid";
import {
  Logger,
  Injectable,
  NestInterceptor,
  ExecutionContext,
  InternalServerErrorException,
  CallHandler,
} from "@nestjs/common";
import { Observable, throwError } from "rxjs";
import { catchError, map } from "rxjs/operators";
import { ZodError, ZodTypeAny } from "zod";

@Injectable()
export class ZodInterceptor implements NestInterceptor {
  private readonly logger = new Logger(ZodInterceptor.name);
  constructor(private schema: ZodTypeAny) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((data: unknown) => this.schema.parse(data)),
      catchError((err) => {
        if (err instanceof ZodError) {
          const id = cuid();
          this.logger.error(
            `Response validation error id:${id}, error: ${JSON.stringify(err.issues, null, 2)}`,
          );
          return throwError(
            () => new InternalServerErrorException(`Validation error id:${id}`),
          );
        }
        return throwError(() => err);
      }),
    );
  }
}
