import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { ImageModule } from '@modules/image/image.module';
import { ScheduleModule } from '@nestjs/schedule';
import { join } from 'path';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import * as Joi from 'joi';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './config/prisma.module';
import { RedisModule } from './config/redis.module';
import { CommonModule } from './common/common.module';
import { AuthModule } from './modules/auth/auth.module';
import { UserModule } from './modules/user/user.module';
import { BookingModule } from './modules/booking/booking.module';
import { PaymentModule } from './modules/payment/payment.module';
import { ChatModule } from './modules/chat/chat.module';
import { NotificationModule } from './modules/notification/notification.module';
import { ReviewModule } from './modules/review/review.module';
import { SafetyModule } from './modules/safety/safety.module';
import { AdminModule } from './modules/admin/admin.module';
import { MatchingModule } from './modules/matching/matching.module';
import { CorporateModule } from './modules/corporate/corporate.module';
import { TrainingModule } from './modules/training/training.module';
import { PremiumModule } from './modules/premium/premium.module';
import { MetricsModule } from './modules/metrics/metrics.module';
import { KycModule } from './modules/kyc/kyc.module';
import { ReferralModule } from './modules/referral/referral.module';
import { ArticleModule } from './modules/article/article.module';
import { TestimonialModule } from './modules/testimonial/testimonial.module';
import { GdprModule } from './modules/gdpr/gdpr.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { InvoiceModule } from './modules/invoice/invoice.module';
import { HealthModule } from './modules/health/health.module';
import appConfig from './config/app.config';
import jwtConfig from './config/jwt.config';
import databaseConfig from './config/database.config';
import redisConfig from './config/redis.config';
import featuresConfig from './config/features.config';

const parseFlag = (raw: string | undefined, fallback = true): boolean => {
  if (raw === undefined || raw === null || raw === '') return fallback;
  return !['0', 'false', 'no', 'off'].includes(raw.trim().toLowerCase());
};

const FEATURE_FLAGS = {
  matching: parseFlag(process.env.ENABLE_MATCHING),
  corporate: parseFlag(process.env.ENABLE_CORPORATE),
  training: parseFlag(process.env.ENABLE_TRAINING),
  premium: parseFlag(process.env.ENABLE_PREMIUM),
  referral: parseFlag(process.env.ENABLE_REFERRAL),
  articles: parseFlag(process.env.ENABLE_ARTICLES),
  testimonials: parseFlag(process.env.ENABLE_TESTIMONIALS),
  gdpr: parseFlag(process.env.ENABLE_GDPR),
  analytics: parseFlag(process.env.ENABLE_ANALYTICS),
};

const optional = <T>(enabled: boolean, mod: T): T[] => (enabled ? [mod] : []);

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, jwtConfig, databaseConfig, redisConfig, featuresConfig],
      envFilePath: ['.env', '../../.env'],
      validationSchema: Joi.object({
        NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
        PORT: Joi.number().default(4000),
        DATABASE_URL: Joi.string().required(),
        ENCRYPTION_KEY: Joi.string().min(16).required(),
        JWT_ACCESS_SECRET: Joi.string().when('NODE_ENV', { is: 'production', then: Joi.required() }),
        JWT_REFRESH_SECRET: Joi.string().when('NODE_ENV', { is: 'production', then: Joi.required() }),
        REDIS_HOST: Joi.string().default('localhost'),
        REDIS_PORT: Joi.number().default(6379),
        // Optional feature flags (all default to enabled)
        ENABLE_MATCHING: Joi.string().optional(),
        ENABLE_CORPORATE: Joi.string().optional(),
        ENABLE_TRAINING: Joi.string().optional(),
        ENABLE_PREMIUM: Joi.string().optional(),
        ENABLE_REFERRAL: Joi.string().optional(),
        ENABLE_ARTICLES: Joi.string().optional(),
        ENABLE_TESTIMONIALS: Joi.string().optional(),
        ENABLE_GDPR: Joi.string().optional(),
        ENABLE_ANALYTICS: Joi.string().optional(),
      }),
      validationOptions: {
        allowUnknown: true,
        abortEarly: false,
      },
    }),

    // Static files (uploads)
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'uploads'),
      serveRoot: '/uploads',
      serveStaticOptions: { index: false },
    }),

    // Rate Limiting
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 1000,
        limit: 3,
      },
      {
        name: 'medium',
        ttl: 10000,
        limit: 20,
      },
      {
        name: 'long',
        ttl: 60000,
        limit: 100,
      },
    ]),

    // Infrastructure
    PrismaModule,
    RedisModule,
    CommonModule,
    ScheduleModule.forRoot(),

    // ── Core MVP modules (always on) ─────────────
    AuthModule,
    UserModule,
    BookingModule,
    PaymentModule,
    ChatModule,
    NotificationModule,
    ReviewModule,
    SafetyModule,
    AdminModule,
    MetricsModule,
    KycModule,
    ImageModule,
    InvoiceModule,
    HealthModule,

    // ── Optional / Phase 2+ modules (flag-gated) ──
    ...optional(FEATURE_FLAGS.matching, MatchingModule),
    ...optional(FEATURE_FLAGS.corporate, CorporateModule),
    ...optional(FEATURE_FLAGS.training, TrainingModule),
    ...optional(FEATURE_FLAGS.premium, PremiumModule),
    ...optional(FEATURE_FLAGS.referral, ReferralModule),
    ...optional(FEATURE_FLAGS.articles, ArticleModule),
    ...optional(FEATURE_FLAGS.testimonials, TestimonialModule),
    ...optional(FEATURE_FLAGS.gdpr, GdprModule),
    ...optional(FEATURE_FLAGS.analytics, AnalyticsModule),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
