import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { MetricsInterceptor } from './modules/metrics/metrics.interceptor';
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

  console.log(`🚀 ARETON.id API running on http://localhost:${port}`);
  console.log(`📚 Swagger docs: http://localhost:${port}/api/docs`);
}

bootstrap();
