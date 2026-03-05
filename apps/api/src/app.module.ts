import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
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
import appConfig from './config/app.config';
import jwtConfig from './config/jwt.config';
import databaseConfig from './config/database.config';
import redisConfig from './config/redis.config';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, jwtConfig, databaseConfig, redisConfig],
      envFilePath: ['.env', '../../.env'],
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

    // Feature Modules
    AuthModule,
    UserModule,
    BookingModule,
    PaymentModule,
    ChatModule,
    NotificationModule,
    ReviewModule,
    SafetyModule,
    AdminModule,
    MatchingModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
