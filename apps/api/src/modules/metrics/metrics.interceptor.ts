import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { MetricsService } from './metrics.service';

@Injectable()
export class MetricsInterceptor implements NestInterceptor {
  constructor(private readonly metricsService: MetricsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    if (context.getType() !== 'http') return next.handle();

    const req = context.switchToHttp().getRequest();
    const res = context.switchToHttp().getResponse();

    // Skip metrics endpoint to avoid recursion
    if (req.url?.includes('/api/metrics')) return next.handle();

    const route = this.normalizeRoute(req.route?.path || req.url);
    const method = req.method;
    const timer = this.metricsService.httpRequestDuration.startTimer({ method, route });

    this.metricsService.activeConnections.inc();

    return next.handle().pipe(
      tap({
        next: () => {
          const statusCode = String(res.statusCode);
          timer({ status_code: statusCode });
          this.metricsService.httpRequestTotal.inc({ method, route, status_code: statusCode });
          if (res.statusCode >= 400) {
            this.metricsService.httpErrorTotal.inc({ method, route, status_code: statusCode });
          }
          this.metricsService.activeConnections.dec();
        },
        error: (err: any) => {
          const statusCode = String(err?.status || 500);
          timer({ status_code: statusCode });
          this.metricsService.httpRequestTotal.inc({ method, route, status_code: statusCode });
          this.metricsService.httpErrorTotal.inc({ method, route, status_code: statusCode });
          this.metricsService.activeConnections.dec();
        },
      }),
    );
  }

  /**
   * Normalize dynamic route params to prevent high cardinality.
   * /api/bookings/abc-123 → /api/bookings/:id
   */
  private normalizeRoute(path: string): string {
    return path
      .replace(/\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, '/:id') // UUID
      .replace(/\/\d+/g, '/:num') // numeric IDs
      .replace(/\?.*$/, ''); // strip query params
  }
}
