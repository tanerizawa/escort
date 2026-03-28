import { Module } from '@nestjs/common';
import { NotificationController } from './notification.controller';
import { NotificationService } from './notification.service';
import { EmailService } from './email.service';
import { PushService } from './push.service';
import { WhatsAppService } from './whatsapp.service';

@Module({
  controllers: [NotificationController],
  providers: [NotificationService, EmailService, PushService, WhatsAppService],
  exports: [NotificationService, EmailService, PushService, WhatsAppService],
})
export class NotificationModule {}
