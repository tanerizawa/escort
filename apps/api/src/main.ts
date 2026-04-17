import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { MetricsInterceptor } from './modules/metrics/metrics.interceptor';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global prefix
  app.setGlobalPrefix('api');

  // Security headers
  app.use(helmet({
    contentSecurityPolicy: false, // Disabled for API — frontend handles CSP
    crossOriginResourcePolicy: { policy: 'cross-origin' }, // Allow uploads cross-origin
  }));

  // CORS — origins from env, supports CORS_ORIGINS comma-separated list
  const corsOrigins = process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(',').map((o) => o.trim()).filter(Boolean)
    : [
        process.env.WEB_URL || 'http://localhost:3000',
        process.env.ADMIN_URL || 'http://localhost:3001',
        // Production `next start` ports used by PM2 / Docker
        'http://localhost:3003',
        'http://localhost:3005',
      ];
  app.enableCors({
    origin: corsOrigins,
    credentials: true,
  });

  // Global pipes
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Global filters
  app.useGlobalFilters(new HttpExceptionFilter());

  // Global interceptors
  const metricsInterceptor = app.get(MetricsInterceptor);
  app.useGlobalInterceptors(new TransformInterceptor(), new LoggingInterceptor(), metricsInterceptor);

  // Swagger API documentation (disable in production for security)
  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('ARETON.id API')
      .setDescription('Professional Companion Service Platform API')
      .setVersion('1.0')
      .addBearerAuth()
      .addTag('auth', 'Authentication & Authorization')
      .addTag('users', 'User Management')
      .addTag('escorts', 'Escort Profiles')
      .addTag('bookings', 'Booking Management')
      .addTag('payments', 'Payment & Escrow')
      .addTag('chat', 'Real-time Chat')
      .addTag('reviews', 'Rating & Reviews')
      .addTag('safety', 'Safety & SOS')
      .addTag('notifications', 'Notifications')
      .addTag('admin', 'Admin Dashboard')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);
  }

  const port = process.env.PORT || 4000;
  await app.listen(port);

  const logger = new Logger('Bootstrap');
  const configService = app.get(ConfigService);

  // Report effective feature flags so ops can see what's enabled at a glance.
  const features = configService.get<Record<string, boolean>>('features') ?? {};
  const enabled = Object.entries(features).filter(([, v]) => v).map(([k]) => k);
  const disabled = Object.entries(features).filter(([, v]) => !v).map(([k]) => k);
  logger.log(`Feature flags — enabled: [${enabled.join(', ') || 'none'}]`);
  if (disabled.length) {
    logger.log(`Feature flags — disabled: [${disabled.join(', ')}]`);
  }

  // Preflight: warn operators when optional integrations are missing so that
  // email / SMS / push fall back to MOCK mode silently no more.
  const warnIfMissing = (label: string, keys: string[]) => {
    const missing = keys.filter((k) => !configService.get<string>(k));
    if (missing.length) {
      logger.warn(`${label} is not fully configured — missing: ${missing.join(', ')}`);
    }
  };
  warnIfMissing('Email (Brevo)', ['BREVO_API_KEY']);
  warnIfMissing('Push (Firebase)', [
    'FIREBASE_PROJECT_ID',
    'FIREBASE_CLIENT_EMAIL',
    'FIREBASE_PRIVATE_KEY',
  ]);
  warnIfMissing('WhatsApp/SMS (Twilio)', [
    'TWILIO_ACCOUNT_SID',
    'TWILIO_AUTH_TOKEN',
    'TWILIO_PHONE_NUMBER',
  ]);
  if (process.env.NODE_ENV === 'production') {
    const prodRequired = ['JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET'];
    const missing = prodRequired.filter((k) => !configService.get<string>(k));
    if (missing.length) {
      // Joi already enforces these, but double-check so that accidentally
      // running with `allowUnknown` + empty values is surfaced loudly.
      logger.error(`Missing required production env vars: ${missing.join(', ')}`);
    }
  }

  logger.log(`🚀 ARETON.id API running on http://localhost:${port}`);
  if (process.env.NODE_ENV !== 'production') {
    logger.log(`📚 Swagger docs: http://localhost:${port}/api/docs`);
  }
}

bootstrap();
