import { Module } from '@nestjs/common';
import { BookingController } from './booking.controller';
import { BookingService } from './booking.service';
import { NotificationModule } from '@modules/notification/notification.module';
import { AdminModule } from '@modules/admin/admin.module';
import { CommonModule } from '@common/common.module';

@Module({
  imports: [NotificationModule, AdminModule, CommonModule],
  controllers: [BookingController],
  providers: [BookingService],
  exports: [BookingService],
})
export class BookingModule {}
