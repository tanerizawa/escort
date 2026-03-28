import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Sentry error tracking service.
 * Requires `@sentry/node` package: npm install @sentry/node
 * Configure via SENTRY_DSN environment variable.
 * Runs in MOCK mode if DSN is empty or @sentry/node is not installed.
 */
@Injectable()
export class SentryService implements OnModuleInit {
  private readonly logger = new Logger(SentryService.name);
  private sentry: any = null;
  private readonly dsn: string;
  private readonly environment: string;

  constructor(private readonly configService: ConfigService) {
    this.dsn = this.configService.get<string>('SENTRY_DSN', '');
    this.environment = this.configService.get<string>('NODE_ENV', 'development');
  }

  async onModuleInit() {
    if (!this.dsn) {
      this.logger.warn('⚠️  SENTRY_DSN not set — error tracking in MOCK mode');
      return;
    }

    try {
      // @ts-ignore — @sentry/node is an optional dependency
      this.sentry = await import('@sentry/node');
      this.sentry.init({
        dsn: this.dsn,
        environment: this.environment,
        tracesSampleRate: this.environment === 'production' ? 0.1 : 1.0,
        beforeSend(event: any) {
          // Scrub PII from exceptions
          if (event.request?.headers) {
            delete event.request.headers['authorization'];
            delete event.request.headers['cookie'];
          }
          return event;
        },
      });
      this.logger.log('✅ Sentry error tracking initialized');
    } catch {
      this.logger.warn('⚠️  @sentry/node not installed — error tracking in MOCK mode. Run: npm install @sentry/node');
    }
  }

  isConfigured(): boolean {
    return !!this.sentry;
  }

  captureException(error: Error | unknown, context?: Record<string, any>): void {
    if (!this.sentry) {
      return;
    }

    this.sentry.withScope((scope: any) => {
      if (context) {
        scope.setExtras(context);
      }
      this.sentry.captureException(error);
    });
  }

  captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info'): void {
    if (!this.sentry) {
      return;
    }
    this.sentry.captureMessage(message, level);
  }

  setUser(user: { id: string; email?: string; role?: string }): void {
    if (!this.sentry) return;
    this.sentry.setUser(user);
  }
}
