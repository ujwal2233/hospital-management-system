import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request, Response } from 'express';
import { AuditService } from '../../modules/audit/audit.service';
import { AuthUser } from '../interfaces/auth-user.interface';

const MUTATING_METHODS = ['POST', 'PUT', 'PATCH', 'DELETE'];

/** Records every mutating API call (who, what, where, outcome) without blocking the response. */
@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private readonly auditService: AuditService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request & { user?: AuthUser }>();
    if (!MUTATING_METHODS.includes(request.method)) return next.handle();

    return next.handle().pipe(
      tap({
        next: () => {
          const statusCode = context.switchToHttp().getResponse<Response>().statusCode;
          void this.log(request, statusCode);
        },
        error: (err: { status?: number }) => {
          void this.log(request, err?.status ?? 500);
        },
      }),
    );
  }

  private log(request: Request & { user?: AuthUser }, statusCode: number): Promise<void> {
    const user = request.user;
    const segments = request.path.split('/').filter(Boolean); // api / v1 / <resource> / <id?>
    return this.auditService.record({
      tenantId: user?.tenantId ?? null,
      userId: user?.userId ?? null,
      userEmail: user?.email,
      action: `${request.method} ${segments.slice(2).join('/') || request.path}`,
      resource: segments[2] ?? 'unknown',
      resourceId: (request.params as { id?: string })?.id,
      method: request.method,
      path: request.originalUrl,
      ip: request.ip,
      statusCode,
    });
  }
}
