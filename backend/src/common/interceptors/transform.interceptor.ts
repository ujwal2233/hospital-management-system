import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

/** Wraps every successful response as { success, data, meta? }. */
@Injectable()
export class TransformInterceptor implements NestInterceptor {
  intercept(_context: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(
      map((payload) => {
        if (payload && typeof payload === 'object' && 'data' in payload && 'meta' in payload) {
          const { data, meta } = payload as { data: unknown; meta: unknown };
          return { success: true, data, meta };
        }
        return { success: true, data: payload ?? null };
      }),
    );
  }
}
