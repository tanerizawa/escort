import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global prefix
  app.setGlobalPrefix('api');

  // CORS
  app.enableCors({
    origin: [process.env.WEB_URL || 'http://localhost:3000', process.env.ADMIN_URL || 'http://localhost:3001'],
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
  app.useGlobalInterceptors(new TransformInterceptor(), new LoggingInterceptor());

  // Swagger API documentation
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

  const port = process.env.PORT || 4000;
  await app.listen(port);

  console.log(`🚀 ARETON.id API running on http://localhost:${port}`);
  console.log(`📚 Swagger docs: http://localhost:${port}/api/docs`);
}

bootstrap();
